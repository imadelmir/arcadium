package com.ace5.arcadium.exception;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.ace5.arcadium.dto.ApiError;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Gestione centralizzata e uniforme degli errori dell'API (M4-T12).
 *
 * <p>Ogni eccezione che deve comparire nella risposta viene tradotta in un
 * {@link ApiError} con la stessa forma (stato, motivo, messaggio, percorso,
 * istante). I messaggi restano nella lingua della richiesta (M4-T4): il testo
 * vive nei bundle {@code messages*.properties}, non nel codice.
 *
 * <p>Sono gestiti esplicitamente i casi noti — errore applicativo, validazione
 * del corpo, parametro di tipo errato, corpo non leggibile, metodo non
 * supportato, risorsa inesistente — e, come ultima rete, qualunque altra
 * eccezione diventa un 500 uniforme (il dettaglio tecnico finisce nel log, non
 * nella risposta). L'app lancia solo {@link ApiException} per gli errori
 * previsti, quindi il catch-all non nasconde stati significativi.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    /** Errori applicativi previsti (409, 404, 401, 403, 400...) con messaggio localizzato. */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApiException(ApiException ex, HttpServletRequest request) {
        return build(ex.getStatus(), translate(ex.getMessageKey(), ex.getArgs()), request);
    }

    /**
     * Validazione del corpo (400): un messaggio per ogni campo non valido, risolto
     * dai codici che Spring associa al FieldError (es. {@code Size.registerRequest.password})
     * con fallback sul messaggio di default dell'annotazione.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex,
                                                     HttpServletRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fieldError.getField(), messageSource.getMessage(fieldError, locale));
        }
        ApiError body = ApiError.validation(HttpStatus.BAD_REQUEST,
                translate("error.validation", null), request.getRequestURI(), fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    /** Parametro con tipo errato (es. appId non numerico nel path): 400 invece di 500. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                       HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST,
                translate("error.request.typeMismatch", new Object[]{ex.getName()}), request);
    }

    /** Corpo della richiesta mancante o JSON malformato: 400. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException ex,
                                                     HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, translate("error.request.malformed", null), request);
    }

    /** Metodo HTTP non supportato dall'endpoint: 405. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
                                                             HttpServletRequest request) {
        return build(HttpStatus.METHOD_NOT_ALLOWED,
                translate("error.method.notSupported", new Object[]{ex.getMethod()}), request);
    }

    /** Rotta inesistente: 404 uniforme invece della pagina d'errore di default. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoResource(NoResourceFoundException ex,
                                                     HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, translate("error.notFound", null), request);
    }

    /** Rete di sicurezza: qualunque errore non previsto diventa un 500 uniforme. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Errore non gestito su {} {}", request.getMethod(), request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, translate("error.internal", null), request);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(ApiError.of(status, message, request.getRequestURI()));
    }

    private String translate(String key, Object[] args) {
        return messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
    }
}
