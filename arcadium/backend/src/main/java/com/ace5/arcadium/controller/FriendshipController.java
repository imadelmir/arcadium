package com.ace5.arcadium.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.FriendResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.FriendshipService;

/**
 * Amicizie e richieste (change request Community).
 *
 * <ul>
 *   <li>{@code GET    /api/friends}                    — i miei amici;</li>
 *   <li>{@code GET    /api/friends/requests}           — richieste ricevute da accettare;</li>
 *   <li>{@code GET    /api/friends/requests/sent}      — richieste inviate in attesa;</li>
 *   <li>{@code POST   /api/friends/{username}}         — invia una richiesta;</li>
 *   <li>{@code POST   /api/friends/{username}/accept}  — accetta una richiesta ricevuta;</li>
 *   <li>{@code DELETE /api/friends/{username}}         — rifiuta, annulla o rimuovi l'amicizia.</li>
 * </ul>
 *
 * <p>Tutti gli endpoint sono autenticati (SecurityConfig) e lavorano sempre sul
 * principal: non si opera mai per conto di un altro utente.
 */
@RestController
@RequestMapping("/api/friends")
public class FriendshipController {

    private final FriendshipService friendshipService;

    public FriendshipController(FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
    }

    @GetMapping
    public List<FriendResponse> friends(@AuthenticationPrincipal AppUserPrincipal principal) {
        return friendshipService.listFriends(principal.getId());
    }

    @GetMapping("/requests")
    public List<FriendResponse> received(@AuthenticationPrincipal AppUserPrincipal principal) {
        return friendshipService.listReceived(principal.getId());
    }

    @GetMapping("/requests/sent")
    public List<FriendResponse> sent(@AuthenticationPrincipal AppUserPrincipal principal) {
        return friendshipService.listSent(principal.getId());
    }

    @PostMapping("/{username}")
    public FriendResponse request(@AuthenticationPrincipal AppUserPrincipal principal,
                                  @PathVariable String username) {
        return friendshipService.sendRequest(principal.getId(), username);
    }

    @PostMapping("/{username}/accept")
    public FriendResponse accept(@AuthenticationPrincipal AppUserPrincipal principal,
                                 @PathVariable String username) {
        return friendshipService.accept(principal.getId(), username);
    }

    /** Rifiuta una richiesta ricevuta, annulla una inviata o rimuove un amico. */
    @DeleteMapping("/{username}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal AppUserPrincipal principal,
                       @PathVariable String username) {
        friendshipService.remove(principal.getId(), username);
    }
}
