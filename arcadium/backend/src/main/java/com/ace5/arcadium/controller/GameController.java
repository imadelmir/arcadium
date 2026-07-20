package com.ace5.arcadium.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.CatalogQuery;
import com.ace5.arcadium.dto.GameDetailResponse;
import com.ace5.arcadium.dto.GameSummaryResponse;
import com.ace5.arcadium.dto.PageResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.GameService;

/**
 * Endpoint del catalogo giochi (M4-T5, M4-T6).
 *
 * <ul>
 *   <li>{@code GET /api/games} — lista paginata e filtrabile del catalogo (M4-T5);</li>
 *   <li>{@code GET /api/games/{appId}} — dettaglio completo di un gioco (M4-T6).</li>
 * </ul>
 *
 * <p>Filtri della lista (query param, tutti opzionali, in AND):
 * <ul>
 *   <li>{@code q} — sottostringa nel nome (case-insensitive);</li>
 *   <li>{@code genre} / {@code language} / {@code category} — nomi selezionati,
 *       multi-valore (change request Negozio): {@code ?genre=Action,Indie} include
 *       i giochi con almeno uno dei generi elencati (OR), combinato in AND con
 *       gli altri filtri;</li>
 *   <li>{@code platform} — {@code windows} | {@code mac} | {@code linux};</li>
 *   <li>{@code status} — {@code free} | {@code paid} | {@code discounted};</li>
 *   <li>{@code minPrice} / {@code maxPrice} — fascia di prezzo inclusiva
 *       (change request Negozio): {@code price >= minPrice} e {@code price <= maxPrice}.</li>
 * </ul>
 *
 * <p><b>Safe search (change request, V18).</b> Il filtro contenuti per adulti
 * NON e' un query param: si legge dalla colonna {@code app_user.safe_search}
 * dell'utente autenticato. Un parametro sarebbe aggirabile con una richiesta
 * costruita a mano (curl, DevTools), e un filtro di questo tipo deve reggere
 * anche quando il client non collabora. Conseguenza voluta: due utenti che
 * chiedono la stessa identica URL possono ricevere cataloghi diversi.
 *
 * <p>Paginazione/ordinamento standard di Spring Data: {@code page}, {@code size},
 * {@code sort} (es. {@code ?sort=name,desc} per la Z → A). Default: 20 elementi
 * ordinati per nome. Entrambi gli endpoint richiedono autenticazione
 * (SecurityConfig, M4-T3).
 */
@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping
    public PageResponse<GameSummaryResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<String> genre,
            @RequestParam(required = false) List<String> language,
            @RequestParam(required = false) List<String> category,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean europeanOnly,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        // Colonna NOT NULL DEFAULT TRUE: il null si puo' vedere solo su un'entita'
        // non ancora persistita, e in quel caso il default corretto e' "attivo".
        Boolean safeSearch = !Boolean.FALSE.equals(principal.getAppUser().getSafeSearch());

        CatalogQuery filter = new CatalogQuery(
                q, genre, language, category, platform, status, minPrice, maxPrice,
                europeanOnly, safeSearch);
        return gameService.search(filter, pageable);
    }

    /**
     * Valori disponibili per i menu a tendina dei filtri del Negozio: generi,
     * categorie e lingue presenti nel catalogo (change request Negozio). Il
     * frontend li carica una volta per popolare le tendine "Genere", "Categoria"
     * e "Lingua". Path letterale: precede la mappatura {@code /{appId}}.
     */
    @GetMapping("/filters")
    public com.ace5.arcadium.dto.CatalogFiltersResponse filters() {
        return gameService.filters();
    }

    /**
     * Dettaglio completo di un gioco per la sua chiave naturale {@code appId}
     * (M4-T6). Spring converte il segmento di path in Long. Restituisce 200 con
     * la vista completa, oppure 404 localizzato se l'appId non esiste (gestito
     * nel service tramite ApiException).
     *
     * <p>L'endpoint è autenticato (SecurityConfig: {@code anyRequest().authenticated()}),
     * quindi il principal è sempre presente: il suo id serve a valorizzare i flag
     * {@code inWishlist}/{@code inBacklog} del dettaglio (M6-T4).
     */
    @GetMapping("/{appId}")
    public GameDetailResponse detail(@PathVariable Long appId,
                                     @AuthenticationPrincipal AppUserPrincipal principal) {
        return gameService.getByAppId(appId, principal.getId());
    }
}
