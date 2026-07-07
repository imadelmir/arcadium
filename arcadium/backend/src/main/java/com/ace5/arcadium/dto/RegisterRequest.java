package com.ace5.arcadium.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Dati di registrazione (M4-T3). La validazione (@Valid nel controller) blocca
 * le richieste malformate con 400 prima di toccare il servizio.
 * preferredLanguage è opzionale: se assente, il servizio applica 'it'.
 */
public record RegisterRequest(
        @NotBlank @Size(max = 50) String username,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @Size(max = 100) String displayName,
        @Pattern(regexp = "it|en", message = "preferredLanguage deve essere 'it' o 'en'")
        String preferredLanguage
) {
}
