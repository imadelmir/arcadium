package com.ace5.arcadium.steam;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.ace5.arcadium.exception.ApiException;

/**
 * Client HTTP verso la Steam Web API: l'unico punto che parla con l'esterno.
 *
 * <p><b>Chiave per utente.</b> Ogni metodo riceve la chiave API come parametro:
 * e' quella che l'utente ha generato sul proprio account
 * ({@code https://steamcommunity.com/dev/apikey}) e incollato in Arcadium. Non
 * esiste piu' una chiave unica del server: cosi' ogni utente accede ai propri
 * dati con le proprie credenziali, e Arcadium non ha bisogno di custodire una
 * chiave con cui interrogare account altrui.
 *
 * <p>Tre chiamate, tutte GET sulla Steam Web API ufficiale:
 * <ul>
 *   <li><b>GetPlayerSummaries</b> — dato uno SteamID64, restituisce il profilo
 *       pubblico (nickname, avatar). Serve a <em>validare</em> in un colpo solo
 *       la chiave e lo SteamID al momento del collegamento.</li>
 *   <li><b>ResolveVanityURL</b> — traduce il nome personalizzato del profilo
 *       ({@code steamcommunity.com/id/nickname}) nello SteamID64 numerico, cosi'
 *       l'utente non deve conoscere il proprio ID a 17 cifre.</li>
 *   <li><b>GetOwnedGames</b> — la libreria posseduta col tempo di gioco totale
 *       in minuti, usata dalla sincronizzazione.</li>
 * </ul>
 *
 * <p>Le risposte JSON si mappano su record con i nomi dei campi identici alle
 * chiavi Steam ({@code appid}, {@code playtime_forever}, {@code personaname}),
 * cosi' il converter le deserializza senza annotazioni ne' dipendenze aggiuntive
 * e i campi che non ci servono vengono semplicemente ignorati.
 *
 * <p><b>Errori.</b> Steam risponde 403 quando la chiave e' assente o non valida;
 * per non far affiorare dettagli di trasporto ai livelli superiori, qui si
 * traducono subito in {@link ApiException} con chiavi di messaggio localizzate:
 * {@code error.steam.invalidKey} (403/401) e {@code error.steam.unreachable}
 * (qualunque altro guasto di rete o risposta illeggibile).
 *
 * <p><b>Profilo privato.</b> Steam non risponde con un errore HTTP quando il
 * profilo dell'utente e' privato: risponde 200 con un involucro <em>vuoto</em>
 * ({@code {"response":{}}}), senza {@code game_count} e senza {@code games}. Un
 * profilo pubblico con zero giochi risponde invece con {@code game_count: 0}. La
 * discriminante e' quindi la presenza di {@code game_count}: senza di esso la
 * libreria non e' leggibile, e {@link #getOwnedLibrary} lo espone col flag
 * {@code visible} invece di far passare un finto successo con zero giochi.
 */
@Component
public class SteamClient {

    private static final String PLAYER_SUMMARIES_ENDPOINT =
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/";
    private static final String RESOLVE_VANITY_ENDPOINT =
            "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/";
    private static final String OWNED_GAMES_ENDPOINT =
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";

    /** ResolveVanityURL: 1 = trovato, 42 = nessuna corrispondenza. */
    private static final int VANITY_SUCCESS = 1;

    private final RestClient restClient = RestClient.create();

    /**
     * Profilo pubblico di un account Steam. Serve a confermare all'utente che ha
     * collegato l'account giusto ("Collegato come ...").
     *
     * @param apiKey  chiave Steam Web API dell'utente
     * @param steamId SteamID64 (17 cifre)
     * @return il profilo, oppure {@link Optional#empty()} se lo SteamID non
     *         corrisponde ad alcun account
     * @throws ApiException 400 {@code error.steam.invalidKey} se Steam rifiuta la
     *                      chiave; 502 {@code error.steam.unreachable} se non
     *                      risponde
     */
    public Optional<SteamProfile> getPlayerSummary(String apiKey, String steamId) {
        PlayerSummariesEnvelope envelope = call(() -> restClient.get()
                .uri(PLAYER_SUMMARIES_ENDPOINT + "?key={key}&steamids={id}", apiKey, steamId)
                .retrieve()
                .body(PlayerSummariesEnvelope.class));

        List<Player> players = envelope == null || envelope.response() == null
                || envelope.response().players() == null
                ? List.of()
                : envelope.response().players();

        return players.stream()
                .findFirst()
                .map(player -> new SteamProfile(player.steamid(), player.personaname()));
    }

    /**
     * Traduce il nome personalizzato del profilo nello SteamID64 numerico.
     *
     * @param apiKey chiave Steam Web API dell'utente
     * @param vanity il segmento finale di {@code steamcommunity.com/id/...}
     * @return lo SteamID64, oppure {@link Optional#empty()} se nessun profilo usa
     *         quel nome
     * @throws ApiException come {@link #getPlayerSummary}
     */
    public Optional<String> resolveVanityUrl(String apiKey, String vanity) {
        VanityEnvelope envelope = call(() -> restClient.get()
                .uri(RESOLVE_VANITY_ENDPOINT + "?key={key}&vanityurl={vanity}", apiKey, vanity)
                .retrieve()
                .body(VanityEnvelope.class));

        VanityResponse response = envelope == null ? null : envelope.response();
        if (response == null || response.success() == null || response.success() != VANITY_SUCCESS) {
            return Optional.empty();
        }
        return Optional.ofNullable(response.steamid());
    }

    /**
     * Libreria posseduta su Steam, con l'indicazione se sia leggibile o meno.
     *
     * @param apiKey  chiave Steam Web API dell'utente
     * @param steamId SteamID64 dell'utente
     * @return {@link OwnedLibrary} con {@code visible=false} se il profilo Steam e'
     *         privato (libreria non leggibile), altrimenti i giochi posseduti con
     *         il tempo di gioco in minuti (lista eventualmente vuota)
     * @throws ApiException come {@link #getPlayerSummary}
     */
    public OwnedLibrary getOwnedLibrary(String apiKey, String steamId) {
        OwnedGamesEnvelope envelope = call(() -> restClient.get()
                .uri(OWNED_GAMES_ENDPOINT
                        + "?key={key}&steamid={id}&include_appinfo=1&include_played_free_games=1&format=json",
                        apiKey, steamId)
                .retrieve()
                .body(OwnedGamesEnvelope.class));

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

    // -------------------------------------------------------------------------
    // Esecuzione con traduzione degli errori di trasporto in ApiException.
    // Un unico punto: le tre chiamate falliscono allo stesso modo e devono
    // rispondere all'utente con lo stesso vocabolario.
    // -------------------------------------------------------------------------

    private <T> T call(SteamCall<T> steamCall) {
        try {
            return steamCall.execute();
        } catch (RestClientResponseException e) {
            // Steam risponde 403 a chiave assente, revocata o sbagliata.
            int status = e.getStatusCode().value();
            if (status == HttpStatus.FORBIDDEN.value() || status == HttpStatus.UNAUTHORIZED.value()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "error.steam.invalidKey");
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY, "error.steam.unreachable");
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "error.steam.unreachable");
        }
    }

    @FunctionalInterface
    private interface SteamCall<T> {
        T execute();
    }

    // --- tipi esposti al service ---

    /**
     * Profilo pubblico di un account Steam.
     *
     * @param steamId     SteamID64 confermato da Steam
     * @param personaName nickname mostrato sulla community
     */
    public record SteamProfile(String steamId, String personaName) {
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

    // --- mappatura delle risposte JSON di Steam (nomi = chiavi Steam) ---

    record PlayerSummariesEnvelope(PlayerList response) {
    }

    record PlayerList(List<Player> players) {
    }

    record Player(String steamid, String personaname) {
    }

    record VanityEnvelope(VanityResponse response) {
    }

    record VanityResponse(Integer success, String steamid) {
    }

    record OwnedGamesEnvelope(SteamResponse response) {
    }

    record SteamResponse(Integer game_count, List<SteamGame> games) {
    }

    record SteamGame(Long appid, Integer playtime_forever) {
    }
}
