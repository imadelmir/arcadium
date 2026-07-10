package com.ace5.arcadium.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.IntegrationLinksRequest;
import com.ace5.arcadium.dto.IntegrationLinksResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.IntegrationService;

/**
 * Link di integrazione social dell'utente autenticato (M4-T15).
 *
 * <ul>
 *   <li>{@code GET /api/integrations} — link Discord/Twitch attuali.</li>
 *   <li>{@code PUT /api/integrations} — sostituisce i link (validati).</li>
 * </ul>
 *
 * <p>Come backlog e wishlist, opera sul solo utente autenticato, ricavato dal
 * token con {@code @AuthenticationPrincipal}. Richiede autenticazione
 * (SecurityConfig, M4-T3): nessuna modifica alla catena di sicurezza.
 */
@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {

    private final IntegrationService integrationService;

    public IntegrationController(IntegrationService integrationService) {
        this.integrationService = integrationService;
    }

    /** Link social attuali dell'utente. */
    @GetMapping
    public IntegrationLinksResponse getLinks(@AuthenticationPrincipal AppUserPrincipal principal) {
        return integrationService.getLinks(principal.getId());
    }

    /** Sostituisce i link social dell'utente. */
    @PutMapping
    public IntegrationLinksResponse updateLinks(@AuthenticationPrincipal AppUserPrincipal principal,
                                                @RequestBody IntegrationLinksRequest request) {
        return integrationService.updateLinks(principal.getId(), request);
    }
}
