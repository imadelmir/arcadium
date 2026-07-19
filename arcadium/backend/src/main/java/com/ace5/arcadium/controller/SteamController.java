package com.ace5.arcadium.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.SteamConnectRequest;
import com.ace5.arcadium.dto.SteamConnectResponse;
import com.ace5.arcadium.dto.SteamSyncResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.SteamIntegrationService;

import jakarta.validation.Valid;

/**
 * Integrazione Steam dell'utente autenticato.
 *
 * <ul>
 *   <li>{@code POST   /api/integrations/steam/connect} — collega l'account con la
 *       chiave Steam Web API dell'utente.</li>
 *   <li>{@code POST   /api/integrations/steam/sync} — sincronizza libreria e
 *       tempo di gioco.</li>
 *   <li>{@code DELETE /api/integrations/steam} — scollega l'account e cancella la
 *       chiave.</li>
 * </ul>
 *
 * <p>Tutti autenticati (SecurityConfig, M4-T3): l'utente arriva dal token, mai
 * dal corpo della richiesta, quindi ciascuno agisce solo sul proprio
 * collegamento. La sincronizzazione e' un'azione esplicita: e' l'utente a
 * sceglierne il momento.
 *
 * <p>Il collegamento e' un POST anche perche' il corpo trasporta un segreto (la
 * chiave API): in query string finirebbe negli access log del server e nella
 * cronologia del browser.
 *
 * <p>Non esiste piu' {@code GET /login-url}: il login OpenID di Steam
 * identificava l'utente ma non rilasciava alcuna credenziale per leggerne la
 * libreria, quindi non poteva portare a termine il collegamento.
 */
@RestController
@RequestMapping("/api/integrations/steam")
public class SteamController {

    private final SteamIntegrationService steamService;

    public SteamController(SteamIntegrationService steamService) {
        this.steamService = steamService;
    }

    /** Collega l'account Steam verificando profilo e chiave API presso Steam. */
    @PostMapping("/connect")
    public SteamConnectResponse connect(@AuthenticationPrincipal AppUserPrincipal principal,
                                        @Valid @RequestBody SteamConnectRequest request) {
        return steamService.connect(principal.getId(), request);
    }

    /** Sincronizza libreria e tempo di gioco dall'account Steam collegato. */
    @PostMapping("/sync")
    public SteamSyncResponse sync(@AuthenticationPrincipal AppUserPrincipal principal) {
        return steamService.sync(principal.getId());
    }

    /** Scollega l'account Steam (azzera SteamID e chiave API). */
    @DeleteMapping
    public ResponseEntity<Void> unlink(@AuthenticationPrincipal AppUserPrincipal principal) {
        steamService.unlink(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
