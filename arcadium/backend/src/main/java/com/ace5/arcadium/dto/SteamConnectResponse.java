package com.ace5.arcadium.dto;

/**
 * Esito del collegamento a Steam: l'account riconosciuto da Steam e collegato
 * all'utente Arcadium.
 *
 * <p>Il {@code personaName} non viene conservato a database: serve solo a
 * confermare subito all'utente di aver collegato l'account giusto ("Collegato
 * come «nickname»"), evitando la trappola di uno SteamID incollato per sbaglio
 * da un altro profilo.
 *
 * <p>La chiave API non compare qui in nessuna forma, nemmeno mascherata: una
 * volta salvata non esce piu' dal server.
 *
 * @param steamId     SteamID64 verificato e salvato
 * @param personaName nickname pubblico dell'account Steam collegato
 */
public record SteamConnectResponse(String steamId, String personaName) {
}
