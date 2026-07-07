package com.ace5.arcadium.dto;

/**
 * Risposta di registrazione e login (M4-T3): il token JWT, il suo tipo,
 * la scadenza in secondi e la vista dell'utente autenticato.
 */
public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        UserResponse user
) {
}
