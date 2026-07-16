package com.ace5.arcadium.dto;

import java.time.LocalDate;

import com.ace5.arcadium.entity.PlaytimeEntry;

/**
 * Vista di una sessione di gioco registrata a mano (feature "registro ore", M6).
 * Usata nella lista delle voci di un gioco (card backlog) e come risposta alla
 * creazione.
 *
 * @param id       identificatore della voce (serve al DELETE lato frontend)
 * @param appId    gioco a cui la voce appartiene
 * @param minutes  minuti giocati
 * @param playedOn giorno della sessione
 */
public record PlaytimeEntryResponse(
        Long id,
        Long appId,
        Integer minutes,
        LocalDate playedOn
) {
    public static PlaytimeEntryResponse from(PlaytimeEntry entry) {
        return new PlaytimeEntryResponse(
                entry.getId(),
                entry.getGame().getAppId(),
                entry.getMinutes(),
                entry.getPlayedOn());
    }
}
