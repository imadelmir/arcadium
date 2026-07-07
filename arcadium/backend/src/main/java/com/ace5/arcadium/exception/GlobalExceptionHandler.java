package com.ace5.arcadium.exception;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Traduzione centralizzata dei messaggi d'errore (M4-T4).
 *
 * <p>Intercetta le eccezioni che devono comparire nella risposta e ne rende il
 * messaggio nella lingua della richiesta. La lingua e' quella gia' risolta dal
 * {@code AcceptHeaderLocaleResolver} (vedi I18nConfig) e disponibile in
 * {@link LocaleContextHolder}. Il testo vero e proprio vive nei file
 * {@code messages*.properties}, non nel codice.
 *
 * <p>Sono gestiti due casi: gli errori applicativi ({@link ApiException}) e gli
 * errori di validazione dei DTO ({@link MethodArgumentNotValidException}). Ogni
 * altra eccezione resta alla gestione di default di Spring. Il corpo qui e'
 * volutamente minimale: la sua forma definitiva e uniforme e' compito di M4-T12.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    /**
     * Errori applicativi (es. username/email gia' in uso, credenziali non valide).
     * Il codice trasportato dall'eccezione viene tradotto nella lingua corrente.
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException ex) {
        String message = messageSource.getMessage(
                ex.getMessageKey(), ex.getArgs(), LocaleContextHolder.getLocale());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", message);
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    /**
     * Errori di validazione dei DTO (400). Per ogni campo non valido si risolve
     * il messaggio localizzato a partire dai codici che Spring associa al
     * FieldError (es. {@code Size.registerRequest.password}), con fallback sul
     * messaggio di default dell'annotazione se nessun codice e' tradotto.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Locale locale = LocaleContextHolder.getLocale();

        // Un campo -> il suo messaggio tradotto. LinkedHashMap per mantenere l'ordine.
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            // getMessage(MessageSourceResolvable, Locale) prova in ordine i codici
            // del FieldError e usa il defaultMessage come ultima spiaggia.
            String localized = messageSource.getMessage(fieldError, locale);
            fieldErrors.putIfAbsent(fieldError.getField(), localized);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", messageSource.getMessage("error.validation", null, locale));
        body.put("errors", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}