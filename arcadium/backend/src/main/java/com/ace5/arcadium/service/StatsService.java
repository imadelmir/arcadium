package com.ace5.arcadium.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.UserStatsResponse;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.BacklogRepository;
import com.ace5.arcadium.repository.BacklogStatusRepository;
import com.ace5.arcadium.repository.PlaytimeEntryRepository;
import com.ace5.arcadium.repository.WishlistRepository;

/**
 * Statistiche personali dell'utente autenticato (M4-T10).
 *
 * <p>Come backlog e wishlist (M4-T7/T8), tutto e' "scoped" all'utente ricevuto
 * dal controller (ricavato dal token, mai da un parametro): un utente vede solo
 * le proprie statistiche. Non ci sono esiti d'errore da localizzare — si legge
 * la libreria di chi chiama, che al piu' e' vuota — quindi nessuna nuova chiave
 * in {@code messages*.properties}.
 *
 * <p>Le grandezze sono calcolate con query <em>aggregate</em> nel database
 * (conteggio per stato, somma del tempo di gioco, generi distinti, top generi),
 * non caricando l'intero backlog in memoria: coerente con la scelta anti-N+1 del
 * catalogo e del backlog (M4-T5/T8), e adatto a librerie di qualunque dimensione.
 *
 * <p>La ripartizione per stato viene fusa con l'elenco completo degli stati
 * (dalla lookup {@code backlog_status}) cosi' che TUTTI gli stati compaiano —
 * anche quelli a zero — nell'ordine di {@code sort_order}, dando al frontend
 * (M5-T12) un insieme di sezioni stabile per il grafico.
 *
 * <p><b>Feature M6 — ore per mese e "Steam vince".</b> Il totale ore proviene dal
 * sync Steam ({@code backlog.playtime_minutes}) se l'account e' collegato,
 * altrimenti dalla somma delle voci del registro manuale ({@code playtime_entry}).
 * Il grafico "ore per mese" e' invece SEMPRE dal registro manuale (Steam non
 * espone lo storico mensile) e viene sempre restituito con 12 voci in ordine
 * cronologico, anche a zero, per dare al grafico un asse stabile.
 *
 * <p><b>Top giochi e sorgente delle ore.</b> Poiche' con Steam collegato la serie
 * mensile e' per forza di cose vuota — {@code playtime_forever} e' un totale di
 * sempre, senza date — la risposta porta anche i giochi piu' giocati e un campo
 * {@code playtimeSource} ("steam" o "manual") che dice al frontend quale dei due
 * grafici abbia effettivamente qualcosa da mostrare. Cosi' la decisione sta dove
 * si conosce la provenienza del dato, invece di essere dedotta dal client.
 */
@Service
public class StatsService {

    /** Codice dello stato "finito": serve al calcolo del tasso di completamento. */
    private static final String STATUS_FINISHED = "finito";

    /** Quanti generi mostrare nel grafico dei generi piu' frequenti. */
    private static final int TOP_GENRES_LIMIT = 10;

    /** Quanti giochi mostrare nel grafico dei piu' giocati. */
    private static final int TOP_GAMES_LIMIT = 10;

    /** Valori di {@code playtimeSource}: dicono al frontend quale grafico ha senso. */
    private static final String SOURCE_STEAM = "steam";
    private static final String SOURCE_MANUAL = "manual";

    /** Minuti in un'ora, per la conversione del tempo di gioco. */
    private static final long MINUTES_PER_HOUR = 60L;

    /** Fattore di arrotondamento del tasso di completamento (4 decimali). */
    private static final double RATE_SCALE = 10_000d;

    /** Quanti mesi mostra il grafico "ore per mese" (mese corrente + 11 precedenti). */
    private static final int MONTHS_WINDOW = 12;

    private final BacklogRepository backlogRepository;
    private final WishlistRepository wishlistRepository;
    private final BacklogStatusRepository statusRepository;
    private final PlaytimeEntryRepository playtimeRepository;
    private final AppUserRepository userRepository;

    public StatsService(BacklogRepository backlogRepository,
                        WishlistRepository wishlistRepository,
                        BacklogStatusRepository statusRepository,
                        PlaytimeEntryRepository playtimeRepository,
                        AppUserRepository userRepository) {
        this.backlogRepository = backlogRepository;
        this.wishlistRepository = wishlistRepository;
        this.statusRepository = statusRepository;
        this.playtimeRepository = playtimeRepository;
        this.userRepository = userRepository;
    }

    /**
     * Calcola le statistiche personali dell'utente autenticato.
     *
     * @param userId id dell'utente autenticato (dal token)
     * @return statistiche aggregate della sua libreria
     */
    @Transactional(readOnly = true)
    public UserStatsResponse getStats(Long userId) {
        // Ripartizione per stato: mappa codice -> conteggio (solo gli stati presenti).
        Map<String, Long> countByStatus = new HashMap<>();
        for (BacklogRepository.StatusCount row : backlogRepository.countByStatus(userId)) {
            countByStatus.put(row.getCode(), row.getCount());
        }

        long gamesOwned = countByStatus.values().stream().mapToLong(Long::longValue).sum();
        long finished = countByStatus.getOrDefault(STATUS_FINISHED, 0L);

        // Fusione con l'elenco completo degli stati: tutti presenti, in ordine,
        // con le etichette IT/EN e conteggio 0 dove l'utente non ha giochi.
        List<UserStatsResponse.StatusBreakdown> byStatus =
                statusRepository.findAllByOrderBySortOrderAsc().stream()
                        .map(status -> new UserStatsResponse.StatusBreakdown(
                                status.getCode(),
                                status.getLabelIt(),
                                status.getLabelEn(),
                                countByStatus.getOrDefault(status.getCode(), 0L)))
                        .toList();

        // "Steam vince": se l'account Steam e' collegato il totale ore e' quello
        // sincronizzato (backlog.playtime_minutes); altrimenti la somma delle voci
        // del registro manuale. La stessa scelta decide anche da dove vengono i
        // "top giochi", cosi' i due numeri non possono raccontare storie diverse.
        boolean steamConnected = userRepository.isSteamConnected(userId);
        long playtimeMinutes = steamConnected
                ? backlogRepository.sumPlaytimeMinutes(userId)
                : playtimeRepository.sumMinutesByUser(userId);

        long wishlistSize = wishlistRepository.countByUser(userId);
        long distinctGenres = backlogRepository.countDistinctGenres(userId);

        List<UserStatsResponse.TopGenre> topGenres =
                backlogRepository.topGenres(userId, PageRequest.of(0, TOP_GENRES_LIMIT)).stream()
                        .map(genre -> new UserStatsResponse.TopGenre(genre.getName(), genre.getCount()))
                        .toList();

        double completionRate = completionRate(finished, gamesOwned);

        List<UserStatsResponse.MonthlyPlaytime> monthly = monthlyPlaytime(userId);
        List<UserStatsResponse.TopGame> topGames = topGames(userId, steamConnected);

        return new UserStatsResponse(
                gamesOwned,
                wishlistSize,
                playtimeMinutes,
                playtimeMinutes / MINUTES_PER_HOUR,
                distinctGenres,
                completionRate,
                byStatus,
                topGenres,
                monthly,
                topGames,
                steamConnected ? SOURCE_STEAM : SOURCE_MANUAL);
    }

    /**
     * Classifica dei giochi piu' giocati, dalla stessa fonte del totale ore.
     *
     * <p>Con Steam collegato i minuti sono quelli sincronizzati per gioco; senza,
     * la somma delle sessioni dichiarate a mano. Il frontend usa questa serie al
     * posto del grafico mensile quando la fonte e' Steam: {@code playtime_forever}
     * e' un totale di sempre, privo di date, quindi una serie per mese costruita
     * su quel dato sarebbe piatta — e attribuire tutte le ore al mese dell'ultima
     * sessione darebbe un grafico verosimile ma falso.
     */
    private List<UserStatsResponse.TopGame> topGames(Long userId, boolean steamConnected) {
        PageRequest limit = PageRequest.of(0, TOP_GAMES_LIMIT);

        if (steamConnected) {
            return backlogRepository.topPlayedGames(userId, limit).stream()
                    .map(row -> new UserStatsResponse.TopGame(
                            row.getAppId(), row.getName(), row.getHeaderImage(),
                            row.getMinutes(), row.getMinutes() / MINUTES_PER_HOUR))
                    .toList();
        }
        return playtimeRepository.topPlayedGames(userId, limit).stream()
                .map(row -> new UserStatsResponse.TopGame(
                        row.getAppId(), row.getName(), row.getHeaderImage(),
                        row.getMinutes(), row.getMinutes() / MINUTES_PER_HOUR))
                .toList();
    }

    /**
     * Serie "ore per mese" degli ultimi {@link #MONTHS_WINDOW} mesi, dal registro
     * manuale. Sempre 12 voci in ordine cronologico (dal mese piu' vecchio al
     * corrente), riempite a zero dove non ci sono sessioni: cosi' il grafico ad
     * area ha un asse stabile, come {@code byStatus} per gli stati.
     */
    private List<UserStatsResponse.MonthlyPlaytime> monthlyPlaytime(Long userId) {
        LocalDate fromDate = LocalDate.now().withDayOfMonth(1).minusMonths(MONTHS_WINDOW - 1L);

        // Minuti aggregati dal DB, indicizzati per "bucket" anno/mese.
        Map<Integer, Long> minutesByBucket = new HashMap<>();
        for (PlaytimeEntryRepository.MonthlyMinutes row : playtimeRepository.monthlyMinutes(userId, fromDate)) {
            minutesByBucket.put(bucket(row.getYr(), row.getMo()), row.getMinutes());
        }

        List<UserStatsResponse.MonthlyPlaytime> series = new ArrayList<>(MONTHS_WINDOW);
        LocalDate cursor = fromDate;
        for (int i = 0; i < MONTHS_WINDOW; i++) {
            int year = cursor.getYear();
            int month = cursor.getMonthValue();
            long minutes = minutesByBucket.getOrDefault(bucket(year, month), 0L);
            series.add(new UserStatsResponse.MonthlyPlaytime(
                    year, month, minutes, minutes / MINUTES_PER_HOUR));
            cursor = cursor.plusMonths(1);
        }
        return series;
    }

    /** Chiave stabile anno/mese per la mappa di aggregazione (mese 1-12). */
    private static int bucket(int year, int month) {
        return year * 12 + (month - 1);
    }

    /**
     * Quota di giochi finiti sul posseduto, in [0,1], arrotondata a 4 decimali.
     * Zero (senza divisione) se l'utente non possiede giochi.
     */
    private double completionRate(long finished, long owned) {
        if (owned == 0) {
            return 0.0;
        }
        return Math.round((double) finished / owned * RATE_SCALE) / RATE_SCALE;
    }
}
