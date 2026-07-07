package com.ace5.arcadium.service;

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
import com.ace5.arcadium.dto.CatalogQuery;
import com.ace5.arcadium.dto.GameDetailResponse;
import com.ace5.arcadium.dto.GamePlatform;
import com.ace5.arcadium.dto.GameSummaryResponse;
import com.ace5.arcadium.dto.PageResponse;
import com.ace5.arcadium.entity.Game;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.GameRepository;
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

    /** Tetto alla dimensione di pagina, per non degradare su richieste abusive. */
    private static final int MAX_PAGE_SIZE = 100;

    /** Ordinamento di default quando la richiesta non specifica un sort. */
    private static final Sort DEFAULT_SORT = Sort.by("name").ascending();

    /**
     * Campi ordinabili ammessi. Whitelist esplicita: evita 500 su proprietà
     * inesistenti o su collezioni (che non sono ordinabili) e dà un 400 chiaro.
     */
    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "name", "price", "discount", "releaseDate",
            "peakCcu", "positive", "recommendations", "appId");

    private final GameRepository gameRepository;

    public GameService(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
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
        GamePlatform platform = parsePlatform(filter.platform());
        CatalogGameStatus status = parseStatus(filter.status());
        Pageable safePageable = sanitize(pageable);

        Specification<Game> spec = GameSpecifications.build(
                filter.q(), filter.genre(), platform, status);

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
     * @param appId chiave naturale del gioco
     * @return vista completa del gioco
     */
    @Transactional(readOnly = true)
    public GameDetailResponse getByAppId(Long appId) {
        Game game = gameRepository.findById(appId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.game.notFound", appId));
        return GameDetailResponse.from(game);
    }

    // ------------------------------------------------------------------ parsing

    private GamePlatform parsePlatform(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return GamePlatform.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "error.catalog.platform.invalid", raw);
        }
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
     * Valida l'ordinamento (whitelist) e limita la dimensione della pagina.
     * Ricostruisce un {@link Pageable} pulito da passare al repository.
     */
    private Pageable sanitize(Pageable pageable) {
        for (Sort.Order order : pageable.getSort()) {
            if (!SORTABLE_FIELDS.contains(order.getProperty())) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "error.catalog.sort.invalid", order.getProperty());
            }
        }
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : DEFAULT_SORT;
        int size = Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE);
        return PageRequest.of(pageable.getPageNumber(), size, sort);
    }
}