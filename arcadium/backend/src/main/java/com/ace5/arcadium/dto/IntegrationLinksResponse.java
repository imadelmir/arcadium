package com.ace5.arcadium.dto;

import com.ace5.arcadium.entity.AppUser;

/**
 * Link social dell'utente (M4-T15): i valori attualmente salvati.
 *
 * <p>Entrambi possono essere null (link non impostato). Alimenta i pulsanti
 * social del frontend (M5-T6), che mostrano il bottone solo se il link c'e'.
 *
 * @param discordUrl link Discord, o null
 * @param twitchUrl  link Twitch, o null
 */
public record IntegrationLinksResponse(
        String discordUrl,
        String twitchUrl
) {

    /**
     * Proietta i link social di un utente.
     *
     * @param user utente
     * @return i suoi link social
     */
    public static IntegrationLinksResponse from(AppUser user) {
        return new IntegrationLinksResponse(user.getDiscordUrl(), user.getTwitchUrl());
    }
}
