package com.ace5.arcadium.dto;

/**
 * Corpo del PUT /api/integrations (M4-T15): i link social dell'utente.
 *
 * <p>Semantica di sostituzione (PUT): il corpo rappresenta lo stato desiderato
 * completo. Un campo nullo o vuoto <em>azzera</em> quel link; un valore presente
 * lo imposta, previa validazione nel service (dev'essere un URL http(s) del
 * dominio giusto — Discord o Twitch), con 400 localizzato se non valido. La
 * validazione di dominio sta nel service, coerente con lo status del backlog
 * (M4-T8).
 *
 * @param discordUrl link al profilo Discord (opzionale; vuoto = azzera)
 * @param twitchUrl  link al canale Twitch (opzionale; vuoto = azzera)
 */
public record IntegrationLinksRequest(
        String discordUrl,
        String twitchUrl
) {
}
