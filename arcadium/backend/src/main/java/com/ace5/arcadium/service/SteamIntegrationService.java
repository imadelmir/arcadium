package com.ace5.arcadium.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.config.SteamProperties;
import com.ace5.arcadium.dto.SteamConnectResponse;
import com.ace5.arcadium.dto.SteamSyncResponse;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.Backlog;
import com.ace5.arcadium.entity.BacklogId;
import com.ace5.arcadium.entity.BacklogStatus;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.BacklogRepository;
import com.ace5.arcadium.repository.BacklogStatusRepository;
import com.ace5.arcadium.repository.GameRepository;
import com.ace5.arcadium.steam.SteamClient;
import com.ace5.arcadium.steam.SteamClient.OwnedGame;

/**
 * Integrazione Steam (M4-T16): connect via OpenID e sincronizzazione opt-in di
 * libreria e tempo di gioco.
 *
 * <p><b>Connect.</b> Il frontend manda l'utente al login OpenID di Steam
 * ({@link #buildLoginUrl()}) e, al ritorno, inoltra al backend i parametri
 * {@code openid.*} insieme al proprio token JWT. Il backend li verifica con Steam
 * (via {@link SteamClient}), estrae lo SteamID64 dal {@code claimed_id} e lo
 * salva sull'utente autenticato. L'identita' dell'utente arriva dal token, non
 * dal callback: niente sessione, coerente con l'API stateless.
 *
 * <p><b>Sync.</b> Esplicita e non distruttiva: legge i giochi posseduti su Steam
 * col tempo di gioco e, per quelli presenti nel catalogo Arcadium, aggiunge le
 * voci mancanti nel backlog (stato iniziale "mai_giocato") e aggiorna il tempo di
 * gioco di quelle gia' presenti, <em>senza</em> toccarne lo stato ne' rimuovere i
 * giochi aggiunti a mano. Cosi' "tenere la propria libreria" e "sincronizzare"
 * convivono: e' l'utente a scegliere se lanciare la sync.
 */
@Service
public class SteamIntegrationService {

    private static final Pattern STEAM_ID_64 = Pattern.compile("(\\d{17})$");
    private static final String DEFAULT_STATUS = "mai_giocato";
    private static final String OPENID_LOGIN = "https://steamcommunity.com/openid/login";
    private static final String OPENID_NS = "http://specs.openid.net/auth/2.0";
    private static final String OPENID_IDENTIFIER_SELECT =
            "http://specs.openid.net/auth/2.0/identifier_select";

    private final SteamClient steamClient;
    private final SteamProperties properties;
    private final AppUserRepository userRepository;
    private final GameRepository gameRepository;
    private final BacklogRepository backlogRepository;
    private final BacklogStatusRepository backlogStatusRepository;

    public SteamIntegrationService(SteamClient steamClient,
                                   SteamProperties properties,
                                   AppUserRepository userRepository,
                                   GameRepository gameRepository,
                                   BacklogRepository backlogRepository,
                                   BacklogStatusRepository backlogStatusRepository) {
        this.steamClient = steamClient;
        this.properties = properties;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.backlogRepository = backlogRepository;
        this.backlogStatusRepository = backlogStatusRepository;
    }

    /**
     * URL di login OpenID di Steam, con return_to alla pagina di callback del
     * frontend. Nessuna chiamata di rete: si costruisce solo la query.
     *
     * @return URL a cui mandare l'utente per autenticarsi su Steam
     */
    public String buildLoginUrl() {
        return OPENID_LOGIN
                + "?openid.ns=" + encode(OPENID_NS)
                + "&openid.mode=checkid_setup"
                + "&openid.return_to=" + encode(properties.getReturnUrl())
                + "&openid.realm=" + encode(properties.getRealm())
                + "&openid.identity=" + encode(OPENID_IDENTIFIER_SELECT)
                + "&openid.claimed_id=" + encode(OPENID_IDENTIFIER_SELECT);
    }

    /**
     * Verifica l'asserzione OpenID e collega lo SteamID all'utente autenticato.
     *
     * @param userId       utente autenticato (dal token)
     * @param openidParams parametri {@code openid.*} tornati da Steam
     * @return lo SteamID collegato
     */
    @Transactional
    public SteamConnectResponse connect(Long userId, Map<String, String> openidParams) {
        if (!steamClient.verifyOpenId(openidParams)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "error.steam.verificationFailed");
        }
        String steamId = extractSteamId(openidParams.get("openid.claimed_id"));

        // Uno stesso account Steam non puo' essere collegato a due utenti diversi.
        userRepository.findBySteamId(steamId).ifPresent(other -> {
            if (!other.getId().equals(userId)) {
                throw new ApiException(HttpStatus.CONFLICT, "error.steam.alreadyLinked");
            }
        });

        loadUser(userId).setSteamId(steamId);
        return new SteamConnectResponse(steamId);
    }

    /**
     * Sincronizza la libreria dell'utente da Steam (aggiunge/aggiorna, non cancella).
     *
     * @param userId utente autenticato
     * @return riepilogo dell'operazione
     */
    @Transactional
    public SteamSyncResponse sync(Long userId) {
        if (!properties.isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "error.steam.notConfigured");
        }
        AppUser user = loadUser(userId);
        String steamId = user.getSteamId();
        if (steamId == null || steamId.isBlank()) {
            throw new ApiException(HttpStatus.CONFLICT, "error.steam.notConnected");
        }

        BacklogStatus defaultStatus = backlogStatusRepository.findByCode(DEFAULT_STATUS)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "error.internal"));

        List<OwnedGame> owned = steamClient.getOwnedGames(steamId);
        int added = 0;
        int updated = 0;
        int skipped = 0;

        for (OwnedGame game : owned) {
            if (!gameRepository.existsById(game.appId())) {
                skipped++; // gioco posseduto ma non nel catalogo Arcadium
                continue;
            }
            Optional<Backlog> existing = backlogRepository.findById(new BacklogId(userId, game.appId()));
            if (existing.isPresent()) {
                existing.get().setPlaytimeMinutes(game.playtimeMinutes());
                updated++;
            } else {
                Backlog entry = new Backlog(userRepository.getReferenceById(userId),
                        gameRepository.getReferenceById(game.appId()), defaultStatus);
                entry.setPlaytimeMinutes(game.playtimeMinutes());
                backlogRepository.save(entry);
                added++;
            }
        }
        return new SteamSyncResponse(owned.size(), added, updated, skipped);
    }

    /**
     * Scollega l'account Steam dall'utente (azzera lo SteamID). Non tocca il
     * backlog: i giochi gia' sincronizzati restano.
     *
     * @param userId utente autenticato
     */
    @Transactional
    public void unlink(Long userId) {
        loadUser(userId).setSteamId(null);
    }

    private AppUser loadUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.user.notFound", userId));
    }

    /** Estrae lo SteamID64 (17 cifre) dal claimed_id di Steam. */
    private String extractSteamId(String claimedId) {
        if (claimedId != null) {
            Matcher matcher = STEAM_ID_64.matcher(claimedId);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "error.steam.invalidId");
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
