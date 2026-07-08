package com.ace5.arcadium.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.BacklogItemResponse;
import com.ace5.arcadium.dto.BacklogStatusResponse;
import com.ace5.arcadium.dto.BacklogUpdateRequest;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.BacklogService;

import jakarta.validation.Valid;

/**
 * Endpoint del backlog personale — giochi posseduti con stato (M4-T8).
 *
 * <ul>
 *   <li>{@code GET    /api/backlog}          — elenco del proprio backlog (opz. ?status=);</li>
 *   <li>{@code GET    /api/backlog/statuses} — stati possibili (codice + etichette IT/EN);</li>
 *   <li>{@code POST   /api/backlog/{appId}}  — aggiunge un gioco posseduto (201 Created);</li>
 *   <li>{@code PATCH  /api/backlog/{appId}}  — cambia stato e/o tempo di gioco (200 OK);</li>
 *   <li>{@code DELETE /api/backlog/{appId}}  — rimuove un gioco (204 No Content).</li>
 * </ul>
 *
 * <p>Tutti gli endpoint richiedono autenticazione (SecurityConfig, M4-T3).
 * L'utente NON e' un parametro della richiesta: si ricava dal token con
 * {@code @AuthenticationPrincipal}, cosi' ognuno agisce solo sul proprio backlog.
 */
@RestController
@RequestMapping("/api/backlog")
public class BacklogController {

    private final BacklogService backlogService;

    public BacklogController(BacklogService backlogService) {
        this.backlogService = backlogService;
    }

    /**
     * Elenco del backlog dell'utente autenticato. Con {@code ?status=<codice>}
     * filtra per stato (sezioni in corso/finito/abbandonato); 400 se il codice
     * non e' valido.
     */
    @GetMapping
    public List<BacklogItemResponse> list(@AuthenticationPrincipal AppUserPrincipal principal,
                                          @RequestParam(required = false) String status) {
        return backlogService.list(principal.getId(), status);
    }

    /** Stati possibili del backlog, ordinati per la visualizzazione (M5-T11). */
    @GetMapping("/statuses")
    public List<BacklogStatusResponse> statuses() {
        return backlogService.listStatuses();
    }

    /**
     * Aggiunge il gioco {@code appId} al backlog con stato "mai giocato".
     * Risponde 201 con la voce creata; 404 se il gioco non esiste, 409 se e'
     * gia' nel backlog. Se il gioco era in wishlist, viene tolto dalla wishlist.
     */
    @PostMapping("/{appId}")
    @ResponseStatus(HttpStatus.CREATED)
    public BacklogItemResponse add(@AuthenticationPrincipal AppUserPrincipal principal,
                                   @PathVariable Long appId) {
        return backlogService.add(principal.getId(), appId);
    }

    /**
     * Aggiorna la voce {@code appId}: nuovo stato e/o tempo di gioco (entrambi
     * opzionali). Risponde 200 con la voce aggiornata; 404 se non nel backlog,
     * 400 se lo stato o il tempo di gioco non sono validi.
     */
    @PatchMapping("/{appId}")
    public BacklogItemResponse update(@AuthenticationPrincipal AppUserPrincipal principal,
                                      @PathVariable Long appId,
                                      @Valid @RequestBody BacklogUpdateRequest request) {
        return backlogService.update(principal.getId(), appId, request);
    }

    /**
     * Rimuove il gioco {@code appId} dal backlog. Risponde 204 senza corpo; 404
     * se quel gioco non e' nel backlog dell'utente.
     */
    @DeleteMapping("/{appId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal AppUserPrincipal principal,
                       @PathVariable Long appId) {
        backlogService.remove(principal.getId(), appId);
    }
}
