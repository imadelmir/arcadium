package com.ace5.arcadium.controller;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.BacklogItemResponse;
import com.ace5.arcadium.dto.PageResponse;
import com.ace5.arcadium.dto.UserResponse;
import com.ace5.arcadium.dto.UserSettingsRequest;
import com.ace5.arcadium.dto.UserSummaryResponse;
import com.ace5.arcadium.dto.WishlistItemResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.UserService;

import jakarta.validation.Valid;

/**
 * Endpoint di ricerca utenti e consultazione della libreria altrui (M4-T9).
 *
 * <ul>
 *   <li>{@code GET /api/users?q=}                  — ricerca utenti (paginata);</li>
 *   <li>{@code GET /api/users/{username}}          — profilo pubblico;</li>
 *   <li>{@code GET /api/users/{username}/backlog}  — backlog dell'utente (se visibile);</li>
 *   <li>{@code GET /api/users/{username}/wishlist} — wishlist dell'utente (se visibile).</li>
 * </ul>
 *
 * <p>Tutti gli endpoint richiedono autenticazione (SecurityConfig, M4-T3). La
 * ricerca e il profilo espongono solo dati pubblici (mai l'email); la libreria
 * di un profilo privato e' visibile solo al proprietario (403 altrimenti).
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Ricerca utenti per username o nome visualizzato. Con {@code q} assente
     * elenca tutti gli utenti (paginati, ordinati per username).
     */
    @GetMapping
    public PageResponse<UserSummaryResponse> search(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return userService.search(principal.getId(), q, pageable);
    }

    /**
     * Aggiorna le impostazioni dell'utente autenticato (change request privacy):
     * per ora la visibilita' del profilo. PATCH parziale.
     */
    @PatchMapping("/me")
    public UserResponse updateMe(@AuthenticationPrincipal AppUserPrincipal principal,
                                 @Valid @RequestBody UserSettingsRequest request) {
        return userService.updateSettings(principal.getId(), request);
    }

    /** Profilo pubblico di un utente. 404 se l'username non esiste. */
    @GetMapping("/{username}")
    public UserSummaryResponse profile(@PathVariable String username) {
        return userService.getProfile(username);
    }

    /**
     * Backlog dell'utente {@code username}. 404 se l'utente non esiste, 403 se
     * il profilo e' privato e non e' il proprio.
     */
    @GetMapping("/{username}/backlog")
    public List<BacklogItemResponse> backlog(@AuthenticationPrincipal AppUserPrincipal principal,
                                             @PathVariable String username) {
        return userService.backlogOf(principal.getId(), username);
    }

    /**
     * Wishlist dell'utente {@code username}. 404 se l'utente non esiste, 403 se
     * il profilo e' privato e non e' il proprio.
     */
    @GetMapping("/{username}/wishlist")
    public List<WishlistItemResponse> wishlist(@AuthenticationPrincipal AppUserPrincipal principal,
                                               @PathVariable String username) {
        return userService.wishlistOf(principal.getId(), username);
    }
}
