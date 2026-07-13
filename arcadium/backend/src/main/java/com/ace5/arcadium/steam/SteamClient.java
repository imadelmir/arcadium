package com.ace5.arcadium.steam;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import com.ace5.arcadium.config.SteamProperties;

/**
 * Client HTTP verso Steam (M4-T16): l'unico punto che parla con l'esterno.
 *
 * <p>Due chiamate:
 * <ul>
 *   <li><b>verifica OpenID</b>: rimanda a Steam i parametri {@code openid.*}
 *       ricevuti dopo il login, con {@code mode=check_authentication}; Steam
 *       risponde {@code is_valid:true} se l'asserzione e' autentica. Non serve la
 *       API key.</li>
 *   <li><b>libreria posseduta</b>: GetOwnedGames della Steam Web API (serve la
 *       API key), da cui si leggono app_id e tempo di gioco totale (minuti).</li>
 * </ul>
 *
 * <p>Le risposte JSON si mappano su record con i nomi dei campi identici alle
 * chiavi Steam ({@code appid}, {@code playtime_forever}), cosi' il converter le
 * deserializza senza annotazioni ne' dipendenze aggiuntive.
 *
 * <p><b>Profilo privato (M6-T4).</b> Steam non risponde con un errore HTTP quando
 * il profilo dell'utente e' privato: risponde 200 con un involucro <em>vuoto</em>
 * ({@code {"response":{}}}), senza {@code game_count} e senza {@code games}. Un
 * profilo pubblico con zero giochi risponde invece con {@code game_count: 0}. La
 * discriminante e' quindi la presenza di {@code game_count}: senza di esso la
 * libreria non e' leggibile. Prima questa distinzione andava persa (entrambi i
 * casi diventavano "lista vuota") e la sync riportava un finto successo con zero
 * giochi; ora {@link #getOwnedLibrary(String)} la espone con il flag
 * {@code visible}.
 */
@Component
public class SteamClient {

    private static final String OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
    private static final String OWNED_GAMES_ENDPOINT =
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";

    private final RestClient restClient = RestClient.create();
    private final SteamProperties properties;

    public SteamClient(SteamProperties properties) {
        this.properties = properties;
    }

    /**
     * Verifica con Steam l'autenticita' di un'asserzione OpenID.
     *
     * @param openidParams i parametri {@code openid.*} tornati dal login
     * @return true se Steam conferma l'asserzione
     */
    public boolean verifyOpenId(Map<String, String> openidParams) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        openidParams.forEach((key, value) -> {
            if (key != null && key.startsWith("openid.")) {
                form.add(key, value);
            }
        });
        form.set("openid.mode", "check_authentication");

        String body = restClient.post()
                .uri(OPENID_ENDPOINT)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(String.class);

        return body != null && body.contains("is_valid:true");
    }

    /**
     * Libreria posseduta su Steam, con l'indicazione se sia leggibile o meno.
     *
     * @param steamId SteamID64 dell'utente
     * @return {@link OwnedLibrary} con {@code visible=false} se il profilo Steam e'
     *         privato (libreria non leggibile), altrimenti i giochi posseduti con
     *         il tempo di gioco in minuti (lista eventualmente vuota)
     */
    public OwnedLibrary getOwnedLibrary(String steamId) {
        OwnedGamesEnvelope envelope = restClient.get()
                .uri(OWNED_GAMES_ENDPOINT
                        + "?key={key}&steamid={id}&include_appinfo=1&include_played_free_games=1&format=json",
                        properties.getApiKey(), steamId)
                .retrieve()
                .body(OwnedGamesEnvelope.class);

        SteamResponse response = envelope == null ? null : envelope.response();

        // Nessun game_count = profilo privato: Steam non ci fa vedere la libreria.
        if (response == null || response.game_count() == null) {
            return new OwnedLibrary(false, List.of());
        }

        List<SteamGame> games = response.games() == null ? List.of() : response.games();
        List<OwnedGame> owned = games.stream()
                .map(game -> new OwnedGame(game.appid(),
                        game.playtime_forever() == null ? 0 : game.playtime_forever()))
                .toList();
        return new OwnedLibrary(true, owned);
    }

    /**
     * Esito della lettura della libreria.
     *
     * @param visible false se il profilo Steam e' privato (games e' vuoto e non
     *                significa "nessun gioco", ma "non possiamo saperlo")
     * @param games   giochi posseduti, vuoto se il profilo non e' leggibile
     */
    public record OwnedLibrary(boolean visible, List<OwnedGame> games) {
    }

    public record OwnedGame(Long appId, Integer playtimeMinutes) {
    }

    // --- mappatura della risposta JSON di Steam (nomi = chiavi Steam) ---

    record OwnedGamesEnvelope(SteamResponse response) {
    }

    record SteamResponse(Integer game_count, List<SteamGame> games) {
    }

    record SteamGame(Long appid, Integer playtime_forever) {
    }
}
