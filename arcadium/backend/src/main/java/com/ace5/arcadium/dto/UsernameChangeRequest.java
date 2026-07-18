package com.ace5.arcadium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Richiesta di cambio username (V16). Stessi vincoli base dello username in
 * registrazione: obbligatorio e al massimo 50 caratteri. Le regole semantiche
 * (cooldown di 2 mesi, unicità, "uguale all'attuale") sono verificate nel
 * {@code UserService}.
 *
 * @param username nuovo username desiderato
 */
public record UsernameChangeRequest(
        @NotBlank @Size(max = 50) String username
) {
}
