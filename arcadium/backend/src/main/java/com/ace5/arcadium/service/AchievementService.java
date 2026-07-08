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
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.UserAchievement;
import com.ace5.arcadium.repository.AchievementRepository;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.UserAchievementRepository;

/**
 * Motore di sblocco degli achievement interni (M4-T11).
 *
 * <p>Sistema <em>data-driven</em> (M1-T7): non c'e' codice dedicato a ogni
 * badge. Ogni definizione porta una {@code metric} e una {@code threshold}; il
 * motore calcola le metriche dell'utente, e per ogni badge attivo confronta il
 * valore della sua metrica con la soglia. Aggiungere un badge = aggiungere una
 * riga al seed, senza toccare questo codice.
 *
 * <p>Le metriche non vengono ricalcolate qui: si riusano quelle gia' aggregate
 * da {@link StatsService} (M4-T10) — {@code games_owned}, {@code games_finished}
 * e sorelle, {@code playtime_hours}, {@code wishlist_size},
 * {@code distinct_genres} — le stesse elencate in M1-T7 §5. I conteggi per stato
 * (finito/abbandonato/in corso) si leggono dalla ripartizione {@code byStatus}.
 *
 * <p>Lo sblocco e' idempotente: un badge gia' presente in {@code user_achievement}
 * non viene ri-sbloccato, e gli sblocchi non si revocano mai (coerente con M1-T7:
 * i badge si disattivano, non si cancellano; se in futuro l'utente scende sotto
 * la soglia, il badge conquistato resta). Tutto e' "scoped" all'utente ricevuto
 * dal token: nessun 404/403 da localizzare, quindi nessuna nuova chiave messaggio.
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
    private final AppUserRepository userRepository;
    private final StatsService statsService;

    public AchievementService(AchievementRepository achievementRepository,
                              UserAchievementRepository userAchievementRepository,
                              AppUserRepository userRepository,
                              StatsService statsService) {
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.userRepository = userRepository;
        this.statsService = statsService;
    }

    /**
     * Elenca tutti gli achievement attivi per l'utente, con avanzamento e stato
     * di sblocco. Non sblocca nulla: e' una sola lettura (per la pagina badge).
     *
     * @param userId id dell'utente autenticato
     * @return badge attivi con progress e flag di sblocco, in ordine di seed
     */
    @Transactional(readOnly = true)
    public List<AchievementResponse> list(Long userId) {
        Map<String, Long> metrics = metricsOf(userId);
        Map<Long, LocalDateTime> unlockedAt = unlockedByAchievementId(userId);

        return achievementRepository.findByIsActiveTrueOrderByIdAsc().stream()
                .map(achievement -> AchievementResponse.of(
                        achievement,
                        progress(metrics, achievement),
                        unlockedAt.get(achievement.getId())))
                .toList();
    }

    /**
     * Valuta gli achievement dell'utente e sblocca quelli appena conquistati:
     * per ogni badge attivo non ancora sbloccato, se il valore della sua metrica
     * ha raggiunto la soglia, inserisce lo sblocco. Idempotente: rieseguito senza
     * nuovi progressi non sblocca nulla.
     *
     * @param userId id dell'utente autenticato
     * @return i badge sbloccati in questa esecuzione (vuoto se nessuno)
     */
    @Transactional
    public List<AchievementResponse> evaluate(Long userId) {
        Map<String, Long> metrics = metricsOf(userId);
        Map<Long, LocalDateTime> unlockedAt = unlockedByAchievementId(userId);

        List<AchievementResponse> newlyUnlocked = new ArrayList<>();
        AppUser user = null; // riferimento risolto solo se c'e' almeno uno sblocco

        for (Achievement achievement : achievementRepository.findByIsActiveTrueOrderByIdAsc()) {
            if (unlockedAt.containsKey(achievement.getId())) {
                continue; // gia' sbloccato: non si tocca
            }
            long current = progress(metrics, achievement);
            if (current >= achievement.getThreshold()) {
                if (user == null) {
                    user = userRepository.getReferenceById(userId);
                }
                UserAchievement saved = userAchievementRepository
                        .saveAndFlush(new UserAchievement(user, achievement));
                newlyUnlocked.add(AchievementResponse.of(achievement, current, saved.getUnlockedAt()));
            }
        }
        return newlyUnlocked;
    }

    /**
     * Metriche dell'utente (M1-T7 §5) riusando l'aggregato di {@link StatsService}
     * (M4-T10). I conteggi per stato derivano dalla ripartizione byStatus.
     */
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

    /** Mappa achievementId -> momento di sblocco, per l'utente. */
    private Map<Long, LocalDateTime> unlockedByAchievementId(Long userId) {
        Map<Long, LocalDateTime> unlockedAt = new HashMap<>();
        for (UserAchievement ua : userAchievementRepository.findByUserWithAchievement(userId)) {
            unlockedAt.put(ua.getAchievement().getId(), ua.getUnlockedAt());
        }
        return unlockedAt;
    }

    /**
     * Valore corrente della metrica del badge. Se la metrica non e' fra quelle
     * supportate (riga di seed introdotta prima del supporto nel motore), vale 0:
     * il badge resta non sbloccabile finche' la metrica non viene gestita, senza
     * far fallire l'endpoint (data-driven robusto).
     */
    private long progress(Map<String, Long> metrics, Achievement achievement) {
        return metrics.getOrDefault(achievement.getMetric(), 0L);
    }
}
