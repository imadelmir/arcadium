package com.ace5.arcadium.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.AchievementResponse;
import com.ace5.arcadium.dto.UserStatsResponse;
import com.ace5.arcadium.entity.Achievement;
import com.ace5.arcadium.entity.UserAchievement;
import com.ace5.arcadium.repository.AchievementRepository;
import com.ace5.arcadium.repository.UserAchievementRepository;

/**
 * Achievement interni (M4-T11): motore di sblocco data-driven.
 *
 * <p>Ogni definizione porta una <em>metrica</em> ({@code games_owned},
 * {@code games_finished}, ...) e una <em>soglia</em>. Il motore calcola le metriche
 * dell'utente dal suo backlog e dalla wishlist (riusando {@link StatsService}), le
 * confronta con le soglie degli achievement attivi e registra gli sblocchi nuovi.
 * Non esiste codice dedicato per singolo badge: aggiungerne uno significa
 * aggiungere una riga al seed.
 *
 * <p><b>M6-T4 — gli achievement non si sbloccavano mai.</b> Il motore esisteva ed
 * era corretto, ma {@link #evaluate(Long)} non veniva chiamato da nessuno: il
 * frontend leggeva solo {@link #list(Long)}, che mostrava il progresso ma pescava
 * gli sblocchi da una tabella che restava vuota per sempre. Ora la valutazione e'
 * parte della lettura: {@code list()} calcola le metriche (cosa che gia' faceva),
 * sblocca cio' che e' dovuto e restituisce la lista aggiornata. Cosi' non c'e'
 * nessun punto di chiamata da ricordarsi — ne' ora ne' in futuro — e anche le
 * librerie popolate <em>prima</em> di questa correzione sbloccano i badge alla
 * prima apertura della pagina. {@link #evaluate(Long)} resta come endpoint
 * esplicito e condivide lo stesso motore.
 *
 * <p>La scrittura durante una GET e' voluta: e' idempotente (uno sblocco gia'
 * registrato non viene toccato) e invisibile al chiamante, che riceve comunque
 * solo la lista.
 */
@Service
public class AchievementService {

    // Codici degli stati del backlog (da cui derivano le metriche per stato).
    private static final String STATUS_IN_PROGRESS = "in_corso";
    private static final String STATUS_FINISHED = "finito";
    private static final String STATUS_ABANDONED = "abbandonato";

    // Nomi delle metriche ammesse (M1-T7 §5), come nel seed R__achievements.sql.
    private static final String METRIC_GAMES_OWNED = "games_owned";
    private static final String METRIC_GAMES_FINISHED = "games_finished";
    private static final String METRIC_GAMES_ABANDONED = "games_abandoned";
    private static final String METRIC_GAMES_IN_PROGRESS = "games_in_progress";
    private static final String METRIC_PLAYTIME_HOURS = "playtime_hours";
    private static final String METRIC_WISHLIST_SIZE = "wishlist_size";
    private static final String METRIC_DISTINCT_GENRES = "distinct_genres";

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final StatsService statsService;

    // AppUserRepository non serve piu': lo sblocco non costruisce un'entita'
    // UserAchievement (che avrebbe richiesto il riferimento all'utente), ma passa
    // dall'INSERT ... ON CONFLICT del repository.
    public AchievementService(AchievementRepository achievementRepository,
                              UserAchievementRepository userAchievementRepository,
                              StatsService statsService) {
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.statsService = statsService;
    }

    /**
     * Catalogo degli achievement attivi con progresso e stato di sblocco dell'utente.
     * Prima di rispondere valuta le soglie e registra gli sblocchi maturati.
     *
     * @param userId utente autenticato
     * @return tutti gli achievement attivi, in ordine di definizione
     */
    @Transactional
    public List<AchievementResponse> list(Long userId) {
        Map<String, Long> metrics = metricsOf(userId);
        List<Achievement> active = achievementRepository.findByIsActiveTrueOrderByIdAsc();
        Map<Long, LocalDateTime> unlockedAt = unlockedByAchievementId(userId);

        List<Achievement> unlockedNow = unlockDue(userId, active, metrics, unlockedAt);
        if (!unlockedNow.isEmpty()) {
            // Rilettura: i timestamp degli sblocchi appena registrati li conosce il DB.
            unlockedAt = unlockedByAchievementId(userId);
        }

        Map<Long, LocalDateTime> tempi = unlockedAt;
        return active.stream()
                .map(achievement -> AchievementResponse.of(
                        achievement,
                        progress(metrics, achievement),
                        tempi.get(achievement.getId())))
                .toList();
    }

    /**
     * Valuta le soglie e registra gli sblocchi maturati (endpoint esplicito).
     *
     * @param userId utente autenticato
     * @return i soli achievement sbloccati adesso (lista vuota se nulla di nuovo)
     */
    @Transactional
    public List<AchievementResponse> evaluate(Long userId) {
        Map<String, Long> metrics = metricsOf(userId);
        List<Achievement> active = achievementRepository.findByIsActiveTrueOrderByIdAsc();
        Map<Long, LocalDateTime> unlockedAt = unlockedByAchievementId(userId);

        List<Achievement> unlockedNow = unlockDue(userId, active, metrics, unlockedAt);
        if (unlockedNow.isEmpty()) {
            return List.of();
        }

        Map<Long, LocalDateTime> tempi = unlockedByAchievementId(userId);
        return unlockedNow.stream()
                .map(achievement -> AchievementResponse.of(
                        achievement,
                        progress(metrics, achievement),
                        tempi.get(achievement.getId())))
                .toList();
    }

    // -------------------------------------------------------------------------
    // Motore di sblocco (unico, condiviso da list ed evaluate).
    // -------------------------------------------------------------------------

    /**
     * Registra gli achievement la cui metrica ha raggiunto la soglia e che l'utente
     * non ha ancora. L'inserimento passa da {@code ON CONFLICT DO NOTHING}: due
     * valutazioni in parallelo non si pestano i piedi (vedi
     * {@link UserAchievementRepository#insertIfAbsent}).
     *
     * @return gli achievement sbloccati da questa esecuzione
     */
    private List<Achievement> unlockDue(Long userId,
                                        List<Achievement> active,
                                        Map<String, Long> metrics,
                                        Map<Long, LocalDateTime> alreadyUnlocked) {
        List<Achievement> unlockedNow = new ArrayList<>();
        for (Achievement achievement : active) {
            if (alreadyUnlocked.containsKey(achievement.getId())) {
                continue; // gia' sbloccato: non si tocca
            }
            if (progress(metrics, achievement) < achievement.getThreshold()) {
                continue; // soglia non raggiunta
            }
            if (userAchievementRepository.insertIfAbsent(userId, achievement.getId()) > 0) {
                unlockedNow.add(achievement);
            }
        }
        return unlockedNow;
    }

    private Map<String, Long> metricsOf(Long userId) {
        UserStatsResponse stats = statsService.getStats(userId);

        Map<String, Long> byStatus = new HashMap<>();
        for (UserStatsResponse.StatusBreakdown section : stats.byStatus()) {
            byStatus.put(section.code(), section.count());
        }

        Map<String, Long> metrics = new HashMap<>();
        metrics.put(METRIC_GAMES_OWNED, stats.gamesOwned());
        metrics.put(METRIC_GAMES_FINISHED, byStatus.getOrDefault(STATUS_FINISHED, 0L));
        metrics.put(METRIC_GAMES_ABANDONED, byStatus.getOrDefault(STATUS_ABANDONED, 0L));
        metrics.put(METRIC_GAMES_IN_PROGRESS, byStatus.getOrDefault(STATUS_IN_PROGRESS, 0L));
        metrics.put(METRIC_PLAYTIME_HOURS, stats.playtimeHours());
        metrics.put(METRIC_WISHLIST_SIZE, stats.wishlistSize());
        metrics.put(METRIC_DISTINCT_GENRES, stats.distinctGenres());
        return metrics;
    }

    private Map<Long, LocalDateTime> unlockedByAchievementId(Long userId) {
        Map<Long, LocalDateTime> unlockedAt = new HashMap<>();
        for (UserAchievement ua : userAchievementRepository.findByUserWithAchievement(userId)) {
            unlockedAt.put(ua.getAchievement().getId(), ua.getUnlockedAt());
        }
        return unlockedAt;
    }

    /** Valore corrente della metrica misurata dall'achievement (0 se sconosciuta). */
    private long progress(Map<String, Long> metrics, Achievement achievement) {
        return metrics.getOrDefault(achievement.getMetric(), 0L);
    }
}
