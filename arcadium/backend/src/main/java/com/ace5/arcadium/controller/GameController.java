package com.ace5.arcadium.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.CatalogQuery;
import com.ace5.arcadium.dto.GameSummaryResponse;
import com.ace5.arcadium.dto.PageResponse;
import com.ace5.arcadium.service.GameService;

/**
 * Endpoint del catalogo giochi (M4-T5).
 *
 * <ul>
 *   <li>{@code GET /api/games} — lista paginata e filtrabile del catalogo.</li>
 * </ul>
 *
 * <p>Filtri (query param, tutti opzionali, in AND):
 * <ul>
 *   <li>{@code q} — sottostringa nel nome (case-insensitive);</li>
 *   <li>{@code genre} — nome del genere;</li>
 *   <li>{@code platform} — {@code windows} | {@code mac} | {@code linux};</li>
 *   <li>{@code status} — {@code free} | {@code paid} | {@code discounted}.</li>
 * </ul>
 *
 * <p>Paginazione/ordinamento standard di Spring Data: {@code page}, {@code size},
 * {@code sort} (es. {@code ?sort=price,desc}). Default: 20 elementi ordinati per
 * nome. L'endpoint richiede autenticazione (SecurityConfig, M4-T3).
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
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {

        CatalogQuery filter = new CatalogQuery(q, genre, platform, status);
        return gameService.search(filter, pageable);
    }
}
