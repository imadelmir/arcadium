package com.ace5.arcadium.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.AuthResponse;
import com.ace5.arcadium.dto.LoginRequest;
import com.ace5.arcadium.dto.RegisterRequest;
import com.ace5.arcadium.dto.UserResponse;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.exception.ApiException;
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
 * <p>Aggiornamento M4-T4: gli errori non usano più testo fisso italiano ma un
 * {@link ApiException} che trasporta una <em>chiave</em> di messaggio; è il
 * GlobalExceptionHandler a tradurla nella lingua della richiesta. La forma
 * uniforme e strutturata degli errori resta demandata a M4-T12.
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
        // Unicità: la chiave sarà tradotta in IT/EN al momento della risposta.
        if (userRepository.existsByUsername(request.username())) {
            throw new ApiException(HttpStatus.CONFLICT, "error.username.taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "error.email.taken");
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
        // Stessa chiave per "utente inesistente" e "password errata": non si
        // rivela quali username esistono.
        AppUser user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED, "error.credentials.invalid"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "error.credentials.invalid");
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(AppUser user) {
        String token = jwtService.generateToken(user);
        long expiresInSeconds = jwtService.getExpirationMs() / 1000;
        return new AuthResponse(token, "Bearer", expiresInSeconds, UserResponse.from(user));
    }
}
