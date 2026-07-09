package com.ace5.arcadium.security;

import java.io.IOException;
import java.util.Locale;

import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.LocaleResolver;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Risposta agli accessi negati a livello di catena di sicurezza (M4-T12): un 403
 * con la stessa forma {@code ApiError} degli altri errori. Gemello di
 * {@link JwtAuthenticationEntryPoint}; scrive il JSON a mano, senza Jackson.
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final MessageSource messageSource;
    private final LocaleResolver localeResolver;

    public RestAccessDeniedHandler(MessageSource messageSource,
                                   LocaleResolver localeResolver) {
        this.messageSource = messageSource;
        this.localeResolver = localeResolver;
    }

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        Locale locale = localeResolver.resolveLocale(request);
        String message = messageSource.getMessage("error.access.denied", null, locale);

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(ErrorJson.build(
                HttpStatus.FORBIDDEN, message, request.getRequestURI()));
    }
}