package com.ace5.arcadium.dto;

/**
 * Risposta di GET /api/integrations/steam/login-url (M4-T16): l'URL a cui il
 * frontend deve mandare l'utente per il login OpenID di Steam.
 *
 * @param redirectUrl URL di login OpenID su steamcommunity.com
 */
public record SteamLoginUrlResponse(String redirectUrl) {
}
