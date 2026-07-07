package com.ace5.arcadium.exception;

import org.springframework.http.HttpStatus;

/**
 * Eccezione applicativa con messaggio localizzabile (M4-T4).
 *
 * <p>A differenza di una stringa fissa, questa eccezione trasporta soltanto un
 * <em>codice</em> di messaggio (una chiave dei file {@code messages*.properties})
 * e i suoi eventuali argomenti. E' il {@link GlobalExceptionHandler} a tradurre
 * il codice nella lingua della richiesta al momento della risposta.
 *
 * <p>Porta con se' anche lo {@link HttpStatus} da restituire (es. 409, 401),
 * cosi' il servizio esprime l'errore in modo dichiarativo e il controller resta
 * pulito. La forma <em>uniforme</em> del corpo d'errore e' demandata a M4-T12:
 * qui conta solo che il messaggio sia nella lingua giusta.
 */
public class ApiException extends RuntimeException {

    /** Stato HTTP da restituire al client (es. CONFLICT, UNAUTHORIZED). */
    private final HttpStatus status;

    /** Chiave del messaggio nei bundle (es. "error.username.taken"). */
    private final String messageKey;

    /** Eventuali argomenti da interpolare nel messaggio ({0}, {1}, ...). */
    private final transient Object[] args;

    public ApiException(HttpStatus status, String messageKey, Object... args) {
        super(messageKey); // messaggio "tecnico" (la chiave) utile nei log
        this.status = status;
        this.messageKey = messageKey;
        this.args = args;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public Object[] getArgs() {
        return args;
    }
}