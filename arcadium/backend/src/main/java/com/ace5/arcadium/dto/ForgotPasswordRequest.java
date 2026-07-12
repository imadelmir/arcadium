package com.ace5.arcadium.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Richiesta di recupero password (M4-T17), primo passo del flusso "password
 * dimenticata": l'utente indica la propria email e il server, se esiste un
 * account, gli invia un link di reset.
 *
 * <p>La validazione (@Valid nel controller) blocca le email malformate con 400
 * prima di toccare il servizio. I messaggi vivono nei bundle
 * {@code messages*.properties} (M4-T4), non qui.
 */
public record ForgotPasswordRequest(
        @NotBlank @Email @Size(max = 255) String email
) {
}
