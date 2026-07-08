package com.ace5.arcadium.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.UserStatsResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.StatsService;

/**
 * Endpoint delle statistiche personali (M4-T10).
 *
 * <ul>
 *   <li>{@code GET /api/stats/me} — statistiche della libreria dell'utente autenticato.</li>
 * </ul>
 *
 * <p>Richiede autenticazione: ricade sotto {@code anyRequest().authenticated()}
 * della SecurityConfig (M4-T3), quindi non serve alcuna modifica alla catena di
 * sicurezza. Come per {@code /api/auth/me}, l'utente non e' un parametro della
 * richiesta: si ricava dal token con {@code @AuthenticationPrincipal}, cosi'
 * ognuno vede solo le proprie statistiche.
 */
@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    /** Statistiche della libreria dell'utente autenticato. */
    @GetMapping("/me")
    public UserStatsResponse myStats(@AuthenticationPrincipal AppUserPrincipal principal) {
        return statsService.getStats(principal.getId());
    }
}
