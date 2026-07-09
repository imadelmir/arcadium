package com.ace5.arcadium.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Locale;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.ace5.arcadium.dto.ApiError;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Test unitari del {@link GlobalExceptionHandler} (M4-T12).
 *
 * <p>Verificano, senza contesto Spring, che ogni tipo di errore venga tradotto
 * in un {@link ApiError} uniforme: stato corretto, motivo HTTP, messaggio
 * localizzato (MessageSource mockato), percorso valorizzato, e il dettaglio per
 * campo presente solo per la validazione.
 */
@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    private static final String PATH = "/api/test";

    @Mock
    private MessageSource messageSource;

    @Mock
    private HttpServletRequest request;

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler(messageSource);
        lenient().when(request.getRequestURI()).thenReturn(PATH);
        lenient().when(request.getMethod()).thenReturn("GET");
    }

    @Test
    void apiExceptionBecomesUniformErrorWithItsStatusAndLocalizedMessage() {
        when(messageSource.getMessage(eq("error.username.taken"), any(), any(Locale.class)))
                .thenReturn("Username gia' in uso");
        ApiException ex = new ApiException(HttpStatus.CONFLICT, "error.username.taken");

        ResponseEntity<ApiError> response = handler.handleApiException(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        ApiError body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.status()).isEqualTo(409);
        assertThat(body.error()).isEqualTo("Conflict");
        assertThat(body.message()).isEqualTo("Username gia' in uso");
        assertThat(body.path()).isEqualTo(PATH);
        assertThat(body.fieldErrors()).isNull(); // nessun dettaglio di campo per gli errori applicativi
        assertThat(body.timestamp()).isNotNull();
    }

    @Test
    void validationErrorIsBadRequestWithPerFieldMessages() {
        when(messageSource.getMessage(eq("error.validation"), isNull(), any(Locale.class)))
                .thenReturn("Campi non validi");
        when(messageSource.getMessage(any(MessageSourceResolvable.class), any(Locale.class)))
                .thenReturn("La password deve avere tra 8 e 100 caratteri");

        FieldError fieldError = new FieldError("registerRequest", "password", "troppo corta");
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<ApiError> response = handler.handleValidation(ex, request);

        ApiError body = response.getBody();
        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(body).isNotNull();
        assertThat(body.error()).isEqualTo("Bad Request");
        assertThat(body.message()).isEqualTo("Campi non validi");
        assertThat(body.fieldErrors())
                .containsEntry("password", "La password deve avere tra 8 e 100 caratteri");
    }

    @Test
    void typeMismatchBecomesBadRequestNamingTheParameter() {
        when(messageSource.getMessage(eq("error.request.typeMismatch"), any(), any(Locale.class)))
                .thenReturn("Parametro non valido: appId");
        MethodArgumentTypeMismatchException ex = mock(MethodArgumentTypeMismatchException.class);
        when(ex.getName()).thenReturn("appId");

        ResponseEntity<ApiError> response = handler.handleTypeMismatch(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Parametro non valido: appId");
    }

    @Test
    void unexpectedExceptionBecomesUniformInternalServerError() {
        when(messageSource.getMessage(eq("error.internal"), isNull(), any(Locale.class)))
                .thenReturn("Errore interno del server");

        ResponseEntity<ApiError> response = handler.handleUnexpected(
                new IllegalStateException("boom"), request);

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        ApiError body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.error()).isEqualTo("Internal Server Error");
        assertThat(body.message()).isEqualTo("Errore interno del server");
        assertThat(body.path()).isEqualTo(PATH);
    }
}
