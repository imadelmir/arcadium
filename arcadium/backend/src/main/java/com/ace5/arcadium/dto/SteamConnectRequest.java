package com.ace5.arcadium.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Corpo del POST /api/integrations/steam/connect: le due informazioni che
 * l'utente incolla dal proprio account Steam.
 *
 * <p><b>profile</b> — l'indirizzo del profilo Steam, accettato in tutte le forme
 * in cui l'utente ce l'ha sotto mano, cosi' non deve andare a cercare il proprio
 * identificativo numerico:
 * <ul>
 *   <li>SteamID64 a 17 cifre ({@code 76561198000000000});</li>
 *   <li>URL completo ({@code https://steamcommunity.com/profiles/765611980...}
 *       oppure {@code https://steamcommunity.com/id/nickname});</li>
 *   <li>il solo nome personalizzato ({@code nickname}).</li>
 * </ul>
 * La normalizzazione a SteamID64 la fa il service, che per i nomi personalizzati
 * interroga Steam (ResolveVanityURL).
 *
 * <p><b>apiKey</b> — la chiave Steam Web API generata dall'utente su
 * {@code https://steamcommunity.com/dev/apikey}: 32 caratteri esadecimali. E' un
 * segreto: viaggia solo nel corpo di questa richiesta (mai in query string, dove
 * finirebbe nei log del server), si conserva cifrata (V17) e non viene mai
 * restituita dall'API, nemmeno all'utente che l'ha inserita.
 *
 * @param profile indirizzo o identificativo del profilo Steam
 * @param apiKey  chiave Steam Web API dell'utente
 */
public record SteamConnectRequest(
        @NotBlank String profile,
        @NotBlank String apiKey
) {
}
