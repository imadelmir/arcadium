package com.ace5.arcadium.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.PlaytimeEntryRequest;
import com.ace5.arcadium.dto.PlaytimeEntryResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.PlaytimeService;

import jakarta.validation.Valid;

/**
 * Endpoint del registro ore giocate manuale (feature M6).
 *
 * <ul>
 *   <li>{@code POST   /api/backlog/{appId}/playtime} — aggiunge una sessione (201 Created);</li>
 *   <li>{@code GET    /api/backlog/{appId}/playtime} — elenca le sessioni di quel gioco;</li>
 *   <li>{@code DELETE /api/playtime/{entryId}}       — elimina una sessione (204 No Content).</li>
 * </ul>
 *
 * <p>Tutti richiedono autenticazione (SecurityConfig: {@code anyRequest().authenticated()}).
 * L'utente si ricava dal token con {@code @AuthenticationPrincipal}: ognuno agisce
 * solo sulle proprie voci.
 */
@RestController
@RequestMapping("/api")
public class PlaytimeController {

    private final PlaytimeService playtimeService;

    public PlaytimeController(PlaytimeService playtimeService) {
        this.playtimeService = playtimeService;
    }

    /** Aggiunge una sessione al gioco {@code appId} del proprio backlog. 404 se non posseduto. */
    @PostMapping("/backlog/{appId}/playtime")
    @ResponseStatus(HttpStatus.CREATED)
    public PlaytimeEntryResponse add(@AuthenticationPrincipal AppUserPrincipal principal,
                                     @PathVariable Long appId,
                                     @Valid @RequestBody PlaytimeEntryRequest request) {
        return playtimeService.add(principal.getId(), appId, request);
    }

    /** Sessioni registrate per il gioco {@code appId}, dalla piu' recente. */
    @GetMapping("/backlog/{appId}/playtime")
    public List<PlaytimeEntryResponse> list(@AuthenticationPrincipal AppUserPrincipal principal,
                                            @PathVariable Long appId) {
        return playtimeService.list(principal.getId(), appId);
    }

    /** Elimina una propria sessione. 404 se non esiste o non e' dell'utente. */
    @DeleteMapping("/playtime/{entryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUserPrincipal principal,
                       @PathVariable Long entryId) {
        playtimeService.delete(principal.getId(), entryId);
    }
}
