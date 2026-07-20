package com.ace5.arcadium.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.CatalogGameStatus;
import com.ace5.arcadium.dto.CatalogFiltersResponse;
import com.ace5.arcadium.dto.CatalogQuery;
import com.ace5.arcadium.dto.GameDetailResponse;
import com.ace5.arcadium.dto.GamePlatform;
import com.ace5.arcadium.dto.GameSummaryResponse;
import com.ace5.arcadium.dto.PageResponse;
import com.ace5.arcadium.entity.BacklogId;
import com.ace5.arcadium.entity.Game;
import com.ace5.arcadium.entity.WishlistId;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.BacklogRepository;
import com.ace5.arcadium.repository.GameRepository;
import com.ace5.arcadium.repository.WishlistRepository;
import com.ace5.arcadium.repository.spec.GameSpecifications;

/**
 * Logica di consultazione del catalogo (M4-T5) e del dettaglio gioco (M4-T6).
 *
 * <p>La lista (search) traduce i filtri grezzi in una {@link Specification},
 * esegue la query paginata e proietta i risultati nel DTO leggero
 * {@link GameSummaryResponse}. Il dettaglio (getByAppId) carica un singolo gioco
 * e lo proietta nel DTO completo {@link GameDetailResponse}. Gli errori (filtri
 * non validi, gioco inesistente) diventano risposte HTTP <em>localizzate</em>
 * tramite {@link ApiException}, riusando l'infrastruttura i18n di M4-T4.
 *
 * <p>Sola lettura: il catalogo è immutabile per il backend (lo popola l'ETL, M3).
 */
@Service
public class GameService {

    /**
     * Tetto alla dimensione di pagina, per non degradare su richieste abusive.
     * Alzato a 300 per supportare la paginazione del Negozio (300 giochi/pagina,
     * change request Negozio).
     */
    private static final int MAX_PAGE_SIZE = 300;

    /** Ordinamento di default quando la richiesta non specifica un sort. */
    private static final Sort DEFAULT_SORT = Sort.by("name").ascending();

    /**
     * Campi ordinabili ammessi. Whitelist esplicita: evita 500 su proprietà
     * inesistenti o su collezioni (che non sono ordinabili) e dà un 400 chiaro.
     * La whitelist è per <em>campo</em>, quindi entrambe le direzioni sono
     * ammesse: "name,asc" (A → Z) e "name,desc" (Z → A) passano già.
     */
    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "name", "price", "discount", "releaseDate",
            "peakCcu", "positive", "recommendations", "appId");

    private final GameRepository gameRepository;
    private final WishlistRepository wishlistRepository;
    private final BacklogRepository backlogRepository;

    public GameService(GameRepository gameRepository,
                       WishlistRepository wishlistRepository,
                       BacklogRepository backlogRepository) {
        this.gameRepository = gameRepository;
        this.wishlistRepository = wishlistRepository;
        this.backlogRepository = backlogRepository;
    }

    /**
     * Cerca nel catalogo applicando i filtri e la paginazione richiesti.
     *
     * @param filter   filtri grezzi dalla richiesta
     * @param pageable pagina/dimensione/ordinamento richiesti
     * @return pagina di giochi in forma sintetica
     */
    @Transactional(readOnly = true)
    public PageResponse<GameSummaryResponse> search(CatalogQuery filter, Pageable pageable) {
        List<GamePlatform> platform = parsePlatform(filter.platform());
        CatalogGameStatus status = parseStatus(filter.status());
        validatePriceRange(filter.minPrice(), filter.maxPrice());
        boolean hasJoinFilter = notEmpty(filter.genre())
                || notEmpty(filter.language())
                || notEmpty(filter.category());
        Pageable safePageable = sanitize(pageable, hasJoinFilter);

        Specification<Game> spec = GameSpecifications.build(
                filter.q(), filter.genre(), filter.language(), filter.category(),
                platform, status, filter.minPrice(), filter.maxPrice(),
                filter.europeanOnly(), filter.safeSearch());

        Page<Game> page = gameRepository.findAll(spec, safePageable);
        List<GameSummaryResponse> content = page.getContent().stream()
                .map(GameSummaryResponse::from)
                .toList();

        return PageResponse.of(page, content);
    }

    /**
     * Restituisce il dettaglio completo di un gioco dato il suo appId (M4-T6).
     *
     * <p>La proiezione nel DTO avviene DENTRO questa transazione di sola lettura:
     * così le collezioni LAZY del gioco (generi, lingue, screenshot, ...) vengono
     * caricate mentre la sessione JPA è aperta, evitando la
     * LazyInitializationException che si avrebbe con open-in-view disattivato.
     * Se il gioco non esiste, si risponde 404 con messaggio localizzato.
     *
     * <p>Insieme al dettaglio si calcola la membership dell'utente autenticato:
     * se il gioco è nella sua wishlist e/o nel suo backlog (M6-T4). Sono due
     * controlli di esistenza sulla chiave composta (userId, appId), indicizzata,
     * quindi lookup puntuali. Prima il frontend, per sapere lo stato dei pulsanti
     * "Aggiungi a wishlist/backlog", scaricava le collezioni INTERE dell'utente a
     * ogni apertura del dettaglio e le confrontava lato client: ora la membership
     * arriva con il dettaglio e quelle due chiamate spariscono.
     *
     * @param appId  chiave naturale del gioco
     * @param userId id dell'utente autenticato che richiede il dettaglio
     * @return vista completa del gioco, con i flag di membership per l'utente
     */
    @Transactional(readOnly = true)
    public GameDetailResponse getByAppId(Long appId, Long userId) {
        Game game = gameRepository.findById(appId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.game.notFound", appId));
        boolean inWishlist = wishlistRepository.existsById(new WishlistId(userId, appId));
        boolean inBacklog = backlogRepository.existsById(new BacklogId(userId, appId));
        return GameDetailResponse.from(game, inWishlist, inBacklog);
    }

    /**
     * Valori disponibili per i menu a tendina del Negozio (change request
     * Negozio): generi, categorie e lingue presenti nel catalogo, ciascuno in
     * ordine alfabetico. Sola lettura.
     */
    @Transactional(readOnly = true)
    public CatalogFiltersResponse filters() {
        return new CatalogFiltersResponse(
                gameRepository.findGenreNames(),
                gameRepository.findCategoryNames(),
                gameRepository.findLanguageNames());
    }

    // ------------------------------------------------------------------ parsing

    /** True se la lista contiene almeno un valore selezionato (non null/vuota). */
    private boolean notEmpty(List<String> values) {
        return values != null && !values.isEmpty();
    }

    /** Converte i nomi piattaforma richiesti in enum, ignorando lista assente/vuota. */
    private List<GamePlatform> parsePlatform(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        return raw.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(v -> {
                    try {
                        return GamePlatform.valueOf(v.trim().toUpperCase(Locale.ROOT));
                    } catch (IllegalArgumentException ex) {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "error.catalog.platform.invalid", v);
                    }
                })
                .toList();
    }

    private CatalogGameStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return CatalogGameStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "error.catalog.status.invalid", raw);
        }
    }

    /**
     * Valida la fascia di prezzo (change request Negozio):
     * {@code minPrice >= 0} e {@code maxPrice >= minPrice}. In caso contrario
     * risponde 400 con messaggio localizzato. Entrambi i parametri sono opzionali:
     * se assenti non si applica alcun vincolo.
     */
    private void validatePriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        if (minPrice != null && minPrice.signum() < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "error.catalog.price.invalid");
        }
        if (maxPrice != null && maxPrice.signum() < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "error.catalog.price.invalid");
        }
        if (minPrice != null && maxPrice != null && maxPrice.compareTo(minPrice) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "error.catalog.price.invalid");
        }
    }

    /**
     * Valida l'ordinamento (whitelist) e limita la dimensione della pagina.
     * Ricostruisce un {@link Pageable} pulito da passare al repository.
     */
    private Pageable sanitize(Pageable pageable, boolean hasJoinFilter) {
        for (Sort.Order order : pageable.getSort()) {
            if (!SORTABLE_FIELDS.contains(order.getProperty())) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "error.catalog.sort.invalid", order.getProperty());
            }
        }
        Sort requested = pageable.getSort().isSorted() ? pageable.getSort() : DEFAULT_SORT;
        Sort effective = toEffectiveSort(requested, hasJoinFilter);
        int size = Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE);
        return PageRequest.of(pageable.getPageNumber(), size, effective);
    }

    /**
     * Ordinamento per nome con l'alfabeto latino in testa (change request
     * Negozio: "Nome A-Z / Z-A").
     *
     * <p>Ordina sulla colonna generata {@code name_sort} (migrazione V7): nome
     * minuscolo ripulito dei caratteri iniziali non-lettera, quindi "!AnyWay!"
     * ordina come "anyway" e "#Archery" come "archery". I titoli senza lettera
     * latina (soli numeri, cinese/coreano) hanno {@code name_sort} NULL e con
     * {@code NULLS LAST} restano in fondo sia in A-Z sia in Z-A. {@code appId}
     * è il tie-breaker che rende la paginazione deterministica.
     *
     * <p>Analogo trattamento per {@code price} (change request Negozio: fix
     * filtro/ordinamento prezzo): la richiesta "Prezzo" ordina sulla colonna
     * generata {@code effective_price} (V13, prezzo scontato) invece che sul
     * listino {@code price}, coerente con ciò che la card mostra e con il
     * filtro di fascia prezzo (che confronta lo stesso campo).
     *
     * <p>Eccezione: con il filtro per genere attivo la query usa {@code DISTINCT}
     * e PostgreSQL vieta un {@code ORDER BY} con colonne non presenti nella
     * {@code SELECT DISTINCT}: in quel solo caso si tiene l'ordinamento semplice
     * per {@code name}. Il Negozio non usa il filtro genere.
     */
    private Sort toEffectiveSort(Sort requested, boolean hasJoinFilter) {
        Sort effective = Sort.unsorted();
        for (Sort.Order order : requested) {
            Sort piece;
            if (!hasJoinFilter && "name".equals(order.getProperty())) {
                Sort.Order key = new Sort.Order(order.getDirection(), "nameSort").nullsLast();
                piece = Sort.by(key).and(Sort.by(Sort.Direction.ASC, "appId"));
            } else if ("price".equals(order.getProperty())) {
                piece = Sort.by(order.getDirection(), "effectivePrice");
            } else {
                piece = Sort.by(order.getDirection(), order.getProperty());
            }
            effective = effective.and(piece);
        }
        return effective;
    }
}