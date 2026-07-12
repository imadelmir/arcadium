package com.ace5.arcadium.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.dto.AuthResponse;
import com.ace5.arcadium.dto.ForgotPasswordRequest;
import com.ace5.arcadium.dto.LoginRequest;
import com.ace5.arcadium.dto.PasswordResetResponse;
import com.ace5.arcadium.dto.RegisterRequest;
import com.ace5.arcadium.dto.ResetPasswordRequest;
import com.ace5.arcadium.dto.UserResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.AuthService;
import com.ace5.arcadium.service.PasswordResetService;

import jakarta.validation.Valid;

/**
 * Endpoint di autenticazione (M4-T3) e recupero password (M4-T17).
 *
 * <ul>
 *   <li>{@code POST /api/auth/register} — registrazione (pubblico), 201 + token;</li>
 *   <li>{@code POST /api/auth/login} — login (pubblico), 200 + token;</li>
 *   <li>{@code GET  /api/auth/me} — utente autenticato (protetto), 200;</li>
 *   <li>{@code POST /api/auth/forgot-password} — richiesta reset (pubblico), 200;</li>
 *   <li>{@code POST /api/auth/reset-password} — reimposta password (pubblico), 200.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService,
                          PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AppUserPrincipal principal) {
        return UserResponse.from(principal.getAppUser());
    }

    /**
     * Passo 1 del recupero password (M4-T17): l'utente indica la propria email.
     * Risponde sempre 200 con lo stesso messaggio generico, esista o no l'email.
     */
    @PostMapping("/forgot-password")
    public PasswordResetResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return passwordResetService.forgotPassword(request);
    }

    /**
     * Passo 2 del recupero password (M4-T17): l'utente arriva dal link col token
     * e sceglie una nuova password. Token non valido/scaduto/gia' usato -> 400.
     */
    @PostMapping("/reset-password")
    public PasswordResetResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return passwordResetService.resetPassword(request);
    }
}