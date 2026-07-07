package com.ace5.arcadium.dto;

import jakarta.validation.constraints.NotBlank;

/** Credenziali di login (M4-T3): autenticazione per username. */
public record LoginRequest(
        @NotBlank String username,
        @NotBlank String password
) {
}
