package com.ace5.arcadium.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.ace5.arcadium.entity.AppUser;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Emissione e verifica dei token JWT (M4-T3).
 *
 * <p>Token firmati con HMAC-SHA256 (HS256). Il segreto arriva da configurazione
 * (env {@code JWT_SECRET}) e deve essere lungo almeno 32 caratteri (256 bit),
 * requisito di {@link Keys#hmacShaKeyFor}. Il payload porta:
 * <ul>
 *   <li>{@code sub} = username (usato per ricaricare l'utente nel filtro);</li>
 *   <li>{@code uid} = id dell'utente (comodità per i task successivi);</li>
 *   <li>{@code iat} / {@code exp} = emissione e scadenza.</li>
 * </ul>
 *
 * <p>{@link #parseClaims} verifica firma e scadenza: lancia una JwtException se
 * il token è manomesso o scaduto. Nessuno stato lato server (autenticazione
 * stateless).
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${arcadium.security.jwt.secret}") String secret,
            @Value("${arcadium.security.jwt.expiration}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /** Emette un token firmato per l'utente dato. */
    public String generateToken(AppUser user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("uid", user.getId())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key)
                .compact();
    }

    /**
     * Verifica firma e scadenza e restituisce i claim.
     * @throws io.jsonwebtoken.JwtException se il token è invalido o scaduto.
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Durata del token in millisecondi (per esporre expires_in nella risposta). */
    public long getExpirationMs() {
        return expirationMs;
    }
}
