package com.ace5.arcadium.security;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;

/**
 * Costruttore minimale del JSON d'errore per i filtri di sicurezza (M4-T12).
 *
 * <p>Entry point (401) e access denied handler (403) girano nella catena dei
 * filtri, dove non c'e' il message converter dei controller. Invece di importare
 * Jackson solo per questo, qui si compone a mano lo stesso corpo {@code ApiError}
 * ({timestamp,status,error,message,path}), con escaping dei valori testuali.
 */
final class ErrorJson {

    private ErrorJson() {
    }

    static String build(HttpStatus status, String message, String path) {
        return "{"
                + "\"timestamp\":\"" + LocalDateTime.now() + "\","
                + "\"status\":" + status.value() + ","
                + "\"error\":\"" + escape(status.getReasonPhrase()) + "\","
                + "\"message\":\"" + escape(message) + "\","
                + "\"path\":\"" + escape(path) + "\""
                + "}";
    }

    /** Escaping JSON dei caratteri che romperebbero la stringa (virgolette, backslash, controlli). */
    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(value.length() + 8);
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }
}