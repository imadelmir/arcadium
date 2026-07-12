package com.ace5.arcadium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Richiesta di reimpostazione password (M4-T17), secondo passo del flusso:
 * l'utente arriva dal link con il {@code token} e sceglie la
 * {@code newPassword}.
 *
 * <p>Il vincolo sulla password rispecchia la registrazione (M4-T3): tra 8 e 100
 * caratteri. I messaggi di validazione arrivano dai bundle
 * {@code messages*.properties} (M4-T4).
 */
public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8, max = 100) String newPassword
) {
}
