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
import com.ace5.arcadium.dto.LoginRequest;
import com.ace5.arcadium.dto.RegisterRequest;
import com.ace5.arcadium.dto.UserResponse;
import com.ace5.arcadium.security.AppUserPrincipal;
import com.ace5.arcadium.service.AuthService;

import jakarta.validation.Valid;

/**
 * Endpoint di autenticazione (M4-T3).
 *
 * <ul>
 *   <li>{@code POST /api/auth/register} — registrazione (pubblico), 201 + token;</li>
 *   <li>{@code POST /api/auth/login} — login (pubblico), 200 + token;</li>
 *   <li>{@code GET  /api/auth/me} — utente autenticato (protetto), 200.</li>
 * </ul>
 *
 * register e login sono aperti nella SecurityConfig; me richiede un Bearer token
 * valido, da cui il filtro ricava il principal iniettato con @AuthenticationPrincipal.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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
}
