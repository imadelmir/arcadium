package com.ace5.arcadium.dto;

/**
 * Riepilogo di una sincronizzazione della libreria da Steam (M4-T16).
 *
 * <p>La sync non cancella nulla: aggiunge i giochi nuovi (posseduti su Steam e
 * presenti nel catalogo) e aggiorna il tempo di gioco di quelli gia' nel backlog,
 * senza toccarne lo stato. I giochi posseduti ma non presenti nel catalogo
 * Arcadium vengono saltati.
 *
 * @param ownedOnSteam giochi totali posseduti sull'account Steam
 * @param added        voci di backlog aggiunte (nuovi giochi del catalogo)
 * @param updated      voci gia' presenti a cui e' stato aggiornato il tempo di gioco
 * @param skipped      giochi posseduti non presenti nel catalogo Arcadium
 */
public record SteamSyncResponse(int ownedOnSteam, int added, int updated, int skipped) {
}
