package com.ace5.arcadium.dto;

/**
 * Esito del connect Steam (M4-T16): lo SteamID collegato all'utente.
 *
 * @param steamId SteamID64 verificato e salvato
 */
public record SteamConnectResponse(String steamId) {
}
