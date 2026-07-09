package com.ace5.arcadium.dto;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Corpo d'errore uniforme dell'API (M4-T12).
 *
 * <p>Fino a M4-T11 gli errori avevano forme diverse a seconda dell'origine
 * (l'eccezione applicativa restituiva un solo {@code message}, la validazione
 * aggiungeva {@code errors}, il 401 di sicurezza usava {@code error}). Qui la
 * forma diventa una sola, per ogni errore dell'API: stato, motivo, messaggio
 * localizzato, percorso e istante. Cosi' il frontend (M5) gestisce gli errori in
 * un unico modo.
 *
 * <p>{@link #fieldErrors()} compare solo per gli errori di validazione (400):
 * {@code @JsonInclude(NON_NULL)} lo omette dal JSON quando e' nullo, tenendo la
 * risposta pulita per tutti gli altri casi.
 *
 * @param timestamp   istante dell'errore
 * @param status      codice di stato HTTP (es. 404)
 * @param error       motivo HTTP (es. "Not Found")
 * @param message     messaggio leggibile, nella lingua della richiesta (M4-T4)
 * @param path        percorso della richiesta che ha generato l'errore
 * @param fieldErrors mappa campo -&gt; messaggio, solo per la validazione (altrimenti assente)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors
) {

    /**
     * Errore semplice (senza dettaglio per campo).
     *
     * @param status  stato HTTP da restituire
     * @param message messaggio gia' localizzato
     * @param path    percorso della richiesta
     * @return il corpo d'errore
     */
    public static ApiError of(HttpStatus status, String message, String path) {
        return new ApiError(LocalDateTime.now(), status.value(), status.getReasonPhrase(),
                message, path, null);
    }

    /**
     * Errore di validazione, con il dettaglio dei campi non validi.
     *
     * @param status      stato HTTP (400)
     * @param message     messaggio generale gia' localizzato
     * @param path        percorso della richiesta
     * @param fieldErrors mappa campo -&gt; messaggio localizzato
     * @return il corpo d'errore con i dettagli di campo
     */
    public static ApiError validation(HttpStatus status, String message, String path,
                                      Map<String, String> fieldErrors) {
        return new ApiError(LocalDateTime.now(), status.value(), status.getReasonPhrase(),
                message, path, fieldErrors);
    }
}
