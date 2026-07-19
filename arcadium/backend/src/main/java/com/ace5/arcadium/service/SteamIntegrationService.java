package com.ace5.arcadium.service;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.SteamConnectRequest;
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
import com.ace5.arcadium.security.SecretCipher;
import com.ace5.arcadium.steam.SteamClient;
import com.ace5.arcadium.steam.SteamClient.OwnedGame;
import com.ace5.arcadium.steam.SteamClient.OwnedLibrary;
import com.ace5.arcadium.steam.SteamClient.SteamProfile;

/**
 * Integrazione Steam: collegamento dell'account con la chiave Web API
 * dell'utente e sincronizzazione opt-in di libreria e tempo di gioco.
 *
 * <p><b>Perche' non piu' il login OpenID.</b> Il login OpenID di Steam dimostra
 * soltanto <em>chi</em> e' l'utente: restituisce lo SteamID e nient'altro. Per
 * leggere la libreria e le ore giocate serve comunque una chiave della Steam Web
 * API, che OpenID non rilascia. Il flusso precedente quindi mandava l'utente a
 * fare un login che, anche riuscito, non abilitava la sync — e in pratica si
 * chiudeva con un ritorno in errore all'app. Ora il passaggio e' uno solo ed e'
 * esplicito: l'utente genera la propria chiave sul sito ufficiale di Steam e la
 * incolla in Arcadium.
 *
 * <p><b>Connect.</b> Riceve l'indirizzo del profilo e la chiave API. Il profilo
 * viene normalizzato a SteamID64 ({@link #resolveSteamId}), poi una chiamata a
 * GetPlayerSummaries valida <em>insieme</em> chiave e identificativo: se Steam
 * rifiuta la chiave e' 400 {@code error.steam.invalidKey}, se lo SteamID non
 * esiste e' 400 {@code error.steam.profileNotFound}. Solo a verifica superata si
 * salvano SteamID e chiave (cifrata, {@link SecretCipher}). Un account Steam non
 * puo' essere collegato a due utenti Arcadium diversi (409).
 *
 * <p><b>Sync.</b> Esplicita e non distruttiva: legge i giochi posseduti su Steam
 * col tempo di gioco e, per quelli presenti nel catalogo Arcadium, aggiunge le
 * voci mancanti nel backlog e aggiorna il tempo di gioco di quelle gia' presenti,
 * <em>senza</em> rimuovere i giochi aggiunti a mano. Cosi' "tenere la propria
 * libreria" e "sincronizzare" convivono: e' l'utente a scegliere se lanciarla.
 *
 * <p><b>Stato dedotto dalle ore, ma solo al primo import.</b> Una voce nuova
 * nasce "in corso" se Steam riporta tempo di gioco, "mai giocato" se il gioco e'
 * posseduto ma mai avviato: senza questa distinzione una libreria importata
 * finirebbe tutta in "mai giocato", con la barra di avanzamento vuota accanto a
 * righe che dichiarano centinaia di ore. Da li' in poi lo stato e' dell'utente e
 * la sync non lo tocca piu', nemmeno quando contraddice le ore — riscriverlo
 * significherebbe annullare a ogni sincronizzazione una scelta appena fatta.
 *
 * <p><b>Profilo privato.</b> Se il profilo Steam non e' leggibile, la sync
 * fallisce con 422 e chiave {@code error.steam.profilePrivate}: il frontend
 * mostra l'avviso con il link alle impostazioni privacy di Steam. Un profilo
 * pubblico senza giochi resta invece un successo con zero giochi.
 */
@Service
public class SteamIntegrationService {

    /** SteamID64: esattamente 17 cifre. */
    private static final Pattern STEAM_ID_64 = Pattern.compile("^\\d{17}$");

    /** SteamID64 dentro un URL /profiles/... */
    private static final Pattern PROFILE_URL = Pattern.compile("/profiles/(\\d{17})");

    /** Nome personalizzato dentro un URL /id/... */
    private static final Pattern VANITY_URL = Pattern.compile("/id/([A-Za-z0-9_.-]{2,64})");

    /** Nome personalizzato incollato da solo, senza URL. */
    private static final Pattern VANITY_PLAIN = Pattern.compile("^[A-Za-z0-9_.-]{2,64}$");

    /** Chiave Steam Web API: 32 caratteri esadecimali. */
    private static final Pattern API_KEY = Pattern.compile("^[0-9A-F]{32}$");

    /** Stato di chi possiede il gioco ma non lo ha mai avviato. */
    private static final String STATUS_NEVER_PLAYED = "mai_giocato";

    /** Stato assegnato quando Steam riporta tempo di gioco. */
    private static final String STATUS_IN_PROGRESS = "in_corso";

    private final SteamClient steamClient;
    private final SecretCipher cipher;
    private final AppUserRepository userRepository;
    private final GameRepository gameRepository;
    private final BacklogRepository backlogRepository;
    private final BacklogStatusRepository backlogStatusRepository;

    public SteamIntegrationService(SteamClient steamClient,
                                   SecretCipher cipher,
                                   AppUserRepository userRepository,
                                   GameRepository gameRepository,
                                   BacklogRepository backlogRepository,
                                   BacklogStatusRepository backlogStatusRepository) {
        this.steamClient = steamClient;
        this.cipher = cipher;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.backlogRepository = backlogRepository;
        this.backlogStatusRepository = backlogStatusRepository;
    }

    /**
     * Collega l'account Steam all'utente autenticato, verificando prima con Steam
     * che chiave e profilo siano validi.
     *
     * @param userId  utente autenticato (dal token)
     * @param request profilo Steam e chiave Web API incollati dall'utente
     * @return SteamID collegato e nickname pubblico dell'account
     * @throws ApiException 400 chiave o profilo non validi; 409 account gia'
     *                      collegato a un altro utente; 502 Steam irraggiungibile
     */
    @Transactional
    public SteamConnectResponse connect(Long userId, SteamConnectRequest request) {
        String apiKey = normalizeApiKey(request.apiKey());
        String steamId = resolveSteamId(apiKey, request.profile());

        // Una sola chiamata valida entrambe le cose: se la chiave non va bene
        // Steam risponde 403 (-> invalidKey), se lo SteamID non esiste torna una
        // lista di profili vuota.
        SteamProfile profile = steamClient.getPlayerSummary(apiKey, steamId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "error.steam.profileNotFound"));

        // Uno stesso account Steam non puo' essere collegato a due utenti diversi.
        userRepository.findBySteamId(steamId).ifPresent(other -> {
            if (!other.getId().equals(userId)) {
                throw new ApiException(HttpStatus.CONFLICT, "error.steam.alreadyLinked");
            }
        });

        AppUser user = loadUser(userId);
        user.setSteamId(steamId);
        user.setSteamApiKey(cipher.encrypt(apiKey));

        return new SteamConnectResponse(steamId, profile.personaName());
    }

    /**
     * Sincronizza la libreria dell'utente da Steam (aggiunge/aggiorna, non cancella).
     *
     * @param userId utente autenticato
     * @return riepilogo dell'operazione
     * @throws ApiException 409 {@code error.steam.notConnected} se Steam non e'
     *                      collegato; 422 {@code error.steam.profilePrivate} se il
     *                      profilo Steam non e' leggibile
     */
    @Transactional
    public SteamSyncResponse sync(Long userId) {
        AppUser user = loadUser(userId);
        String steamId = user.getSteamId();
        String storedKey = user.getSteamApiKey();
        if (isBlank(steamId) || isBlank(storedKey)) {
            throw new ApiException(HttpStatus.CONFLICT, "error.steam.notConnected");
        }

        // In chiaro solo qui, per il tempo della chiamata a Steam.
        String apiKey = cipher.decrypt(storedKey);
        OwnedLibrary library = steamClient.getOwnedLibrary(apiKey, steamId);
        if (!library.visible()) {
            // Profilo privato: non e' una libreria vuota, e' una libreria che non
            // possiamo leggere. Meglio un errore parlante che un falso successo.
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "error.steam.profilePrivate");
        }

        BacklogStatus neverPlayed = requireStatus(STATUS_NEVER_PLAYED);
        BacklogStatus inProgress = requireStatus(STATUS_IN_PROGRESS);

        int added = 0;
        int updated = 0;
        int skipped = 0;

        for (OwnedGame game : library.games()) {
            if (!gameRepository.existsById(game.appId())) {
                skipped++; // gioco posseduto ma non nel catalogo Arcadium
                continue;
            }
            int minutes = game.playtimeMinutes() == null ? 0 : game.playtimeMinutes();
            Optional<Backlog> existing = backlogRepository.findById(new BacklogId(userId, game.appId()));

            if (existing.isPresent()) {
                // Voce gia' nel backlog: si aggiorna SOLO il tempo di gioco. Lo
                // stato appartiene all'utente — anche quando contraddice le ore.
                // Se lo riscrivessimo qui, ogni sincronizzazione annullerebbe la
                // sua scelta: sposta un gioco su "mai giocato", risincronizza, e
                // se lo ritrova "in corso" senza aver toccato nulla.
                existing.get().setPlaytimeMinutes(minutes);
                updated++;
            } else {
                // Lo stato iniziale viene dal dato che Steam ci ha appena dato:
                // zero minuti = posseduto ma mai avviato, altrimenti in corso.
                // Senza questa distinzione l'intera libreria importata finirebbe
                // in "mai giocato" anche con centinaia di ore alle spalle, e nel
                // backlog la barra di avanzamento resterebbe vuota su ogni riga.
                Backlog entry = new Backlog(userRepository.getReferenceById(userId),
                        gameRepository.getReferenceById(game.appId()),
                        minutes > 0 ? inProgress : neverPlayed);
                entry.setPlaytimeMinutes(minutes);
                if (minutes > 0) {
                    entry.setStartedAt(LocalDateTime.now());
                }
                backlogRepository.save(entry);
                added++;
            }
        }
        return new SteamSyncResponse(library.games().size(), added, updated, skipped);
    }

    /** Stato di lookup per codice; la sua assenza e' un guasto dei dati di base. */
    private BacklogStatus requireStatus(String code) {
        return backlogStatusRepository.findByCode(code)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "error.internal"));
    }

    /**
     * Scollega l'account Steam: azzera SteamID e chiave API (che smette cosi' di
     * esistere lato Arcadium). Non tocca il backlog: i giochi gia' sincronizzati
     * restano, con il loro stato e le loro ore.
     *
     * @param userId utente autenticato
     */
    @Transactional
    public void unlink(Long userId) {
        AppUser user = loadUser(userId);
        user.setSteamId(null);
        user.setSteamApiKey(null);
    }

    // ------------------------------------------------------------- normalizzazione

    /**
     * Ripulisce e verifica la forma della chiave API prima di spenderla in una
     * chiamata di rete. Steam la mostra in maiuscolo, ma un incolla puo' portarsi
     * dietro spazi o minuscole.
     *
     * @throws ApiException 400 {@code error.steam.invalidKey} se non sono 32
     *                      caratteri esadecimali
     */
    private String normalizeApiKey(String raw) {
        String key = raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT);
        if (!API_KEY.matcher(key).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "error.steam.invalidKey");
        }
        return key;
    }

    /**
     * Porta a SteamID64 qualunque forma di indirizzo del profilo: l'ID numerico,
     * un URL {@code /profiles/...} o {@code /id/...}, o il solo nome
     * personalizzato. I nomi personalizzati si risolvono chiedendo a Steam.
     *
     * @throws ApiException 400 {@code error.steam.invalidProfile} se la stringa non
     *                      e' riconoscibile; 400 {@code error.steam.profileNotFound}
     *                      se Steam non conosce quel nome
     */
    private String resolveSteamId(String apiKey, String rawProfile) {
        String profile = rawProfile == null ? "" : rawProfile.trim();
        if (profile.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "error.steam.invalidProfile");
        }
        if (profile.endsWith("/")) {
            profile = profile.substring(0, profile.length() - 1);
        }

        // 1. gia' uno SteamID64.
        if (STEAM_ID_64.matcher(profile).matches()) {
            return profile;
        }

        // 2. URL con l'ID numerico dentro.
        Matcher profileUrl = PROFILE_URL.matcher(profile);
        if (profileUrl.find()) {
            return profileUrl.group(1);
        }

        // 3. URL con il nome personalizzato, oppure il solo nome personalizzato.
        String vanity = null;
        Matcher vanityUrl = VANITY_URL.matcher(profile);
        if (vanityUrl.find()) {
            vanity = vanityUrl.group(1);
        } else if (VANITY_PLAIN.matcher(profile).matches()) {
            vanity = profile;
        }
        if (vanity == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "error.steam.invalidProfile");
        }

        return steamClient.resolveVanityUrl(apiKey, vanity)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "error.steam.profileNotFound"));
    }

    private AppUser loadUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.user.notFound", userId));
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
