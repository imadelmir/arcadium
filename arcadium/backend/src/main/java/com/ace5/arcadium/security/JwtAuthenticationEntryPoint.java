package com.ace5.arcadium.security;

import java.io.IOException;
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
 * Risposta agli accessi non autenticati (M4-T3), ora localizzata (M4-T4).
 *
 * <p>Senza questo entry point, un accesso senza token a un endpoint protetto
 * produrrebbe una pagina di errore generica. Qui si restituisce un 401 con un
 * corpo JSON minimale. La forma definitiva e uniforme degli errori (Problem
 * Detail) e' demandata a M4-T12.
 *
 * <p>Nota importante: questo entry point vive nella catena dei filtri di
 * sicurezza, che gira PRIMA del DispatcherServlet; a quel punto la lingua non e'
 * ancora nel contesto. Per questo la ricaviamo direttamente dalla richiesta con
 * il {@link LocaleResolver} e traduciamo il testo con il {@link MessageSource}.
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
        // Lingua dedotta dall'header Accept-Language della richiesta.
        Locale locale = localeResolver.resolveLocale(request);
        String message = messageSource.getMessage("error.auth.required", null, locale);

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8"); // per accenti nel messaggio italiano
        response.getWriter().write(
                "{\"error\":\"unauthorized\",\"message\":\"" + message + "\"}");
    }
}