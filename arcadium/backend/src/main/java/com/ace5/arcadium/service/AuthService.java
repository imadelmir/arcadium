package com.ace5.arcadium.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ace5.arcadium.dto.AuthResponse;
import com.ace5.arcadium.dto.LoginRequest;
import com.ace5.arcadium.dto.RegisterRequest;
import com.ace5.arcadium.dto.UserResponse;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.security.JwtService;

/**
 * Logica di autenticazione (M4-T3): registrazione e login.
 *
 * <p>Registrazione: verifica l'unicità di username ed email, salva l'utente con
 * la password sotto forma di hash (mai in chiaro), e restituisce subito un token
 * (auto-login). Login: carica l'utente per username e confronta la password con
 * l'hash; in caso di fallimento restituisce 401 senza distinguere fra "utente
 * inesistente" e "password errata" (non si rivela quali username esistono).
 *
 * <p>Gli errori sono espressi con {@link ResponseStatusException}; la forma
 * uniforme e strutturata degli errori è demandata a M4-T12.
 */
@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AppUserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username già in uso");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email già in uso");
        }

        AppUser user = new AppUser();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName());
        user.setPreferredLanguage(
                request.preferredLanguage() != null ? request.preferredLanguage() : "it");
        user.setIsProfilePublic(true);

        AppUser saved = userRepository.save(user);
        return buildAuthResponse(saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        AppUser user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Credenziali non valide"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenziali non valide");
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(AppUser user) {
        String token = jwtService.generateToken(user);
        long expiresInSeconds = jwtService.getExpirationMs() / 1000;
        return new AuthResponse(token, "Bearer", expiresInSeconds, UserResponse.from(user));
    }
}
