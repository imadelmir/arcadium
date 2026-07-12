package com.ace5.arcadium.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Risposta dei due endpoint di recupero password (M4-T17).
 *
 * <p>Porta un {@code message} gia' localizzato (IT/EN, M4-T4) da mostrare
 * all'utente. La richiesta di reset risponde SEMPRE con lo stesso messaggio
 * generico, esista o no l'email: non si rivela quali indirizzi sono registrati
 * (niente user enumeration).
 *
 * <p>{@code devToken} e' un aiuto <b>solo per lo sviluppo/demo</b>: in assenza
 * di un vero server email (rinviato alla produzione), se il flag
 * {@code arcadium.security.password-reset.expose-token} e' attivo il token
 * viene incluso qui, cosi' si puo' provare l'intero flusso senza leggere i log.
 * In produzione il flag e' OFF e il campo resta {@code null} (omesso dal JSON
 * grazie a {@code @JsonInclude(NON_NULL)}).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PasswordResetResponse(
        String message,
        String devToken
) {

    /** Risposta di solo messaggio (produzione): nessun token esposto. */
    public static PasswordResetResponse of(String message) {
        return new PasswordResetResponse(message, null);
    }
}
