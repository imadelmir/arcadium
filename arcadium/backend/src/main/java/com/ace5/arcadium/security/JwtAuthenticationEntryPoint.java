package com.ace5.arcadium.security;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Locale;

import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.LocaleResolver;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Risposta agli accessi non autenticati (M4-T3), localizzata (M4-T4) e uniforme
 * (M4-T12): un 401 con la stessa forma {@code ApiError} degli altri errori.
 *
 * <p>Questo entry point vive nella catena dei filtri, prima del DispatcherServlet:
 * la lingua non e' ancora nel contesto, quindi si ricava dalla richiesta col
 * {@link LocaleResolver}. Il JSON e' scritto a mano (senza dipendere da Jackson):
 * il corpo e' semplice e i valori sono controllati.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final MessageSource messageSource;
    private final LocaleResolver localeResolver;

    public JwtAuthenticationEntryPoint(MessageSource messageSource,
                                       LocaleResolver localeResolver) {
        this.messageSource = messageSource;
        this.localeResolver = localeResolver;
    }

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        Locale locale = localeResolver.resolveLocale(request);
        String message = messageSource.getMessage("error.auth.required", null, locale);

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(ErrorJson.build(
                HttpStatus.UNAUTHORIZED, message, request.getRequestURI()));
    }
}