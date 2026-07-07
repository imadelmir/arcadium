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

import com.ace5.arcadium.dto.WishlistItemResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.WishlistService;

/**
 * Endpoint della wishlist personale (M4-T7).
 *
 * <ul>
 *   <li>{@code GET    /api/wishlist}         — elenco della propria wishlist;</li>
 *   <li>{@code POST   /api/wishlist/{appId}} — aggiunge un gioco (201 Created);</li>
 *   <li>{@code DELETE /api/wishlist/{appId}} — rimuove un gioco (204 No Content).</li>
 * </ul>
 *
 * <p>Tutti gli endpoint richiedono autenticazione (SecurityConfig, M4-T3).
 * L'utente NON e' un parametro della richiesta: si ricava dal token con
 * {@code @AuthenticationPrincipal}, cosi' ognuno agisce solo sulla propria
 * wishlist e non puo' toccare quella altrui.
 */
@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    /** Elenco della wishlist dell'utente autenticato. */
    @GetMapping
    public List<WishlistItemResponse> list(@AuthenticationPrincipal AppUserPrincipal principal) {
        return wishlistService.list(principal.getId());
    }

    /**
     * Aggiunge il gioco {@code appId} alla wishlist. Risponde 201 con la voce
     * creata; 404 se il gioco non esiste, 409 se e' gia' presente.
     */
    @PostMapping("/{appId}")
    @ResponseStatus(HttpStatus.CREATED)
    public WishlistItemResponse add(@AuthenticationPrincipal AppUserPrincipal principal,
                                    @PathVariable Long appId) {
        return wishlistService.add(principal.getId(), appId);
    }

    /**
     * Rimuove il gioco {@code appId} dalla wishlist. Risponde 204 senza corpo;
     * 404 se quel gioco non e' nella wishlist dell'utente.
     */
    @DeleteMapping("/{appId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal AppUserPrincipal principal,
                       @PathVariable Long appId) {
        wishlistService.remove(principal.getId(), appId);
    }
}