package com.ace5.arcadium.security;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Risposta agli accessi non autenticati (M4-T3).
 *
 * <p>Senza questo entry point, un accesso senza token a un endpoint protetto
 * produrrebbe una pagina di errore generica. Qui si restituisce un 401 con un
 * corpo JSON minimale. La forma definitiva e uniforme degli errori (Problem
 * Detail) è demandata a M4-T12.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(
                "{\"error\":\"unauthorized\",\"message\":\"Autenticazione richiesta\"}");
    }
}
