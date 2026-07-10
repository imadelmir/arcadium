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
     * Giochi posseduti su Steam da un account, col tempo di gioco totale.
     *
     * @param steamId SteamID64 dell'account
     * @return coppie (app_id, minuti giocati); vuoto se l'account non espone la libreria
     */
    public List<OwnedGame> getOwnedGames(String steamId) {
        OwnedGamesEnvelope envelope = restClient.get()
                .uri(OWNED_GAMES_ENDPOINT
                        + "?key={key}&steamid={id}&include_appinfo=1&include_played_free_games=1&format=json",
                        properties.getApiKey(), steamId)
                .retrieve()
                .body(OwnedGamesEnvelope.class);

        if (envelope == null || envelope.response() == null || envelope.response().games() == null) {
            return List.of();
        }
        return envelope.response().games().stream()
                .map(game -> new OwnedGame(game.appid(),
                        game.playtime_forever() == null ? 0 : game.playtime_forever()))
                .toList();
    }

    /** Un gioco posseduto: app_id e minuti giocati totali. */
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
