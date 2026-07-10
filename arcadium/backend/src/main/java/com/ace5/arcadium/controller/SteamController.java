package com.ace5.arcadium.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.SteamConnectResponse;
import com.ace5.arcadium.dto.SteamLoginUrlResponse;
import com.ace5.arcadium.dto.SteamSyncResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.SteamIntegrationService;

/**
 * Integrazione Steam dell'utente autenticato (M4-T16).
 *
 * <ul>
 *   <li>{@code GET  /api/integrations/steam/login-url} — URL di login OpenID di Steam.</li>
 *   <li>{@code POST /api/integrations/steam/connect} — verifica i parametri OpenID e collega lo SteamID.</li>
 *   <li>{@code POST /api/integrations/steam/sync} — sincronizza libreria e tempo di gioco.</li>
 *   <li>{@code DELETE /api/integrations/steam} — scollega l'account Steam.</li>
 * </ul>
 *
 * <p>Tutti autenticati (SecurityConfig, M4-T3): l'utente arriva dal token, anche
 * nel connect (il frontend inoltra i parametri OpenID con il proprio JWT). La
 * sincronizzazione e' un'azione esplicita: l'utente sceglie se lanciarla.
 */
@RestController
@RequestMapping("/api/integrations/steam")
public class SteamController {

    private final SteamIntegrationService steamService;

    public SteamController(SteamIntegrationService steamService) {
        this.steamService = steamService;
    }

    /** URL a cui mandare l'utente per il login OpenID di Steam. */
    @GetMapping("/login-url")
    public SteamLoginUrlResponse loginUrl() {
        return new SteamLoginUrlResponse(steamService.buildLoginUrl());
    }

    /** Verifica l'asserzione OpenID (parametri inoltrati dal frontend) e collega lo SteamID. */
    @PostMapping("/connect")
    public SteamConnectResponse connect(@AuthenticationPrincipal AppUserPrincipal principal,
                                        @RequestBody Map<String, String> openidParams) {
        return steamService.connect(principal.getId(), openidParams);
    }

    /** Sincronizza libreria e tempo di gioco dall'account Steam collegato. */
    @PostMapping("/sync")
    public SteamSyncResponse sync(@AuthenticationPrincipal AppUserPrincipal principal) {
        return steamService.sync(principal.getId());
    }

    /** Scollega l'account Steam (azzera lo SteamID). */
    @DeleteMapping
    public ResponseEntity<Void> unlink(@AuthenticationPrincipal AppUserPrincipal principal) {
        steamService.unlink(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
