package com.ace5.arcadium.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.AchievementResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.AchievementService;

/**
 * Endpoint degli achievement interni (M4-T11).
 *
 * <ul>
 *   <li>{@code GET  /api/achievements} — badge attivi con avanzamento e stato di sblocco.</li>
 *   <li>{@code POST /api/achievements/evaluate} — valuta e sblocca i badge appena conquistati.</li>
 * </ul>
 *
 * <p>Richiedono autenticazione: ricadono sotto {@code anyRequest().authenticated()}
 * della SecurityConfig (M4-T3), quindi nessuna modifica alla catena di sicurezza.
 * L'utente si ricava dal token con {@code @AuthenticationPrincipal}: ognuno agisce
 * solo sui propri achievement.
 */
@RestController
@RequestMapping("/api/achievements")
public class AchievementController {

    private final AchievementService achievementService;

    public AchievementController(AchievementService achievementService) {
        this.achievementService = achievementService;
    }

    /** Achievement attivi dell'utente, con avanzamento e stato di sblocco. */
    @GetMapping
    public List<AchievementResponse> list(@AuthenticationPrincipal AppUserPrincipal principal) {
        return achievementService.list(principal.getId());
    }

    /** Valuta e sblocca i badge appena conquistati; restituisce i nuovi sblocchi. */
    @PostMapping("/evaluate")
    public List<AchievementResponse> evaluate(@AuthenticationPrincipal AppUserPrincipal principal) {
        return achievementService.evaluate(principal.getId());
    }
}
