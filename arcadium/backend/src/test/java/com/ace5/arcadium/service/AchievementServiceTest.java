package com.ace5.arcadium.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ace5.arcadium.dto.AchievementResponse;
import com.ace5.arcadium.dto.UserStatsResponse;
import com.ace5.arcadium.entity.Achievement;
import com.ace5.arcadium.entity.UserAchievement;
import com.ace5.arcadium.repository.AchievementRepository;
import com.ace5.arcadium.repository.UserAchievementRepository;

@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    private static final Long USER_ID = 42L;
    private static final LocalDateTime UNLOCK_TIME = LocalDateTime.of(2026, 7, 8, 12, 0);

    @Mock
    private AchievementRepository achievementRepository;
    @Mock
    private UserAchievementRepository userAchievementRepository;
    @Mock
    private StatsService statsService;

    @InjectMocks
    private AchievementService achievementService;

    @BeforeEach
    void setUp() {
        lenient().when(statsService.getStats(USER_ID)).thenReturn(stats(0, 0, 0, 0, 0, 0, 0));
        lenient().when(userAchievementRepository.findByUserWithAchievement(USER_ID)).thenReturn(List.of());
        lenient().when(achievementRepository.findByIsActiveTrueOrderByIdAsc()).thenReturn(List.of());
        // Default: l'INSERT ... ON CONFLICT registra lo sblocco (1 riga inserita).
        lenient().when(userAchievementRepository.insertIfAbsent(anyLong(), anyLong())).thenReturn(1);
    }

    @Test
    void listMarksUnlockedComputesProgressAndDerivesFinishedFromByStatus() {
        Achievement firstGame = achievement(1, "first_game", "games_owned", 1);
        Achievement collector = achievement(2, "collector_50", "games_owned", 50);
        Achievement finisher = achievement(3, "finisher_10", "games_finished", 10);
        when(achievementRepository.findByIsActiveTrueOrderByIdAsc())
                .thenReturn(List.of(firstGame, collector, finisher));
        // 5 posseduti, 3 finiti (dallo stato 'finito'); first_game gia' sbloccato,
        // nessun'altra soglia raggiunta -> list() non deve sbloccare nulla.
        when(statsService.getStats(USER_ID)).thenReturn(stats(5, 3, 0, 0, 0, 0, 0));
        when(userAchievementRepository.findByUserWithAchievement(USER_ID))
                .thenReturn(List.of(unlock(firstGame, UNLOCK_TIME)));

        List<AchievementResponse> result = achievementService.list(USER_ID);

        assertThat(result).extracting(AchievementResponse::code)
                .containsExactly("first_game", "collector_50", "finisher_10");
        assertThat(result).extracting(AchievementResponse::unlocked)
                .containsExactly(true, false, false);
        assertThat(result).extracting(AchievementResponse::progress)
                .containsExactly(5L, 5L, 3L); // finisher usa games_finished = conteggio 'finito'
        assertThat(result.get(0).unlockedAt()).isEqualTo(UNLOCK_TIME);
        assertThat(result.get(1).unlockedAt()).isNull();
        verify(userAchievementRepository, never()).insertIfAbsent(anyLong(), anyLong());
    }

    /**
     * M6-T4: il cuore della correzione. La sola lettura della pagina Achievement deve
     * sbloccare cio' che l'utente ha gia' meritato — e' il caso delle librerie
     * popolate prima che il motore venisse mai eseguito.
     */
    @Test
    void listUnlocksAchievementsAlreadyEarnedOnPreexistingData() {
        Achievement firstGame = achievement(1, "first_game", "games_owned", 1);
        Achievement collector = achievement(2, "collector_50", "games_owned", 50);
        when(achievementRepository.findByIsActiveTrueOrderByIdAsc())
                .thenReturn(List.of(firstGame, collector));
        when(statsService.getStats(USER_ID)).thenReturn(stats(5, 0, 0, 0, 0, 0, 0)); // 5 giochi
        // Prima dello sblocco la tabella e' vuota; dopo l'INSERT contiene first_game.
        when(userAchievementRepository.findByUserWithAchievement(USER_ID))
                .thenReturn(List.of())
                .thenReturn(List.of(unlock(firstGame, UNLOCK_TIME)));

        List<AchievementResponse> result = achievementService.list(USER_ID);

        verify(userAchievementRepository).insertIfAbsent(USER_ID, 1L); // solo first_game
        verify(userAchievementRepository, never()).insertIfAbsent(USER_ID, 2L); // soglia 50 non raggiunta
        assertThat(result).extracting(AchievementResponse::unlocked).containsExactly(true, false);
        assertThat(result.get(0).unlockedAt()).isEqualTo(UNLOCK_TIME);
    }

    @Test
    void evaluateUnlocksNewlyEarnedSkippingBelowThresholdAndAlreadyUnlocked() {
        Achievement firstGame = achievement(1, "first_game", "games_owned", 1);
        Achievement collector = achievement(2, "collector_50", "games_owned", 50);
        Achievement finisher = achievement(3, "finisher_10", "games_finished", 10);
        when(achievementRepository.findByIsActiveTrueOrderByIdAsc())
                .thenReturn(List.of(firstGame, collector, finisher));
        // 50 posseduti (collector raggiunto), 3 finiti (finisher no); first_game gia' preso
        when(statsService.getStats(USER_ID)).thenReturn(stats(50, 3, 0, 0, 0, 0, 0));
        when(userAchievementRepository.findByUserWithAchievement(USER_ID))
                .thenReturn(List.of(unlock(firstGame, UNLOCK_TIME)))
                .thenReturn(List.of(unlock(firstGame, UNLOCK_TIME), unlock(collector, UNLOCK_TIME)));

        List<AchievementResponse> unlocked = achievementService.evaluate(USER_ID);

        // Sblocca solo collector_50
        verify(userAchievementRepository).insertIfAbsent(USER_ID, 2L);
        verify(userAchievementRepository, never()).insertIfAbsent(USER_ID, 1L);
        verify(userAchievementRepository, never()).insertIfAbsent(USER_ID, 3L);
        assertThat(unlocked).extracting(AchievementResponse::code).containsExactly("collector_50");
        assertThat(unlocked.get(0).unlocked()).isTrue();
        assertThat(unlocked.get(0).unlockedAt()).isEqualTo(UNLOCK_TIME);
        assertThat(unlocked.get(0).progress()).isEqualTo(50L);
    }

    @Test
    void evaluateIsIdempotentWhenEverythingIsAlreadyUnlocked() {
        Achievement firstGame = achievement(1, "first_game", "games_owned", 1);
        Achievement collector = achievement(2, "collector_50", "games_owned", 50);
        when(achievementRepository.findByIsActiveTrueOrderByIdAsc())
                .thenReturn(List.of(firstGame, collector));
        when(statsService.getStats(USER_ID)).thenReturn(stats(100, 0, 0, 0, 0, 0, 0)); // soglie superate
        when(userAchievementRepository.findByUserWithAchievement(USER_ID))
                .thenReturn(List.of(unlock(firstGame, UNLOCK_TIME), unlock(collector, UNLOCK_TIME)));

        List<AchievementResponse> unlocked = achievementService.evaluate(USER_ID);

        assertThat(unlocked).isEmpty();
        verify(userAchievementRepository, never()).insertIfAbsent(anyLong(), anyLong());
    }

    /**
     * M6-T4: due valutazioni concorrenti. La seconda trova la riga gia' inserita
     * (ON CONFLICT DO NOTHING -> 0 righe): niente violazione di chiave primaria,
     * e lo sblocco non viene contato due volte.
     */
    @Test
    void evaluateDoesNotReportAnUnlockLostToAConcurrentRun() {
        Achievement firstGame = achievement(1, "first_game", "games_owned", 1);
        when(achievementRepository.findByIsActiveTrueOrderByIdAsc()).thenReturn(List.of(firstGame));
        when(statsService.getStats(USER_ID)).thenReturn(stats(3, 0, 0, 0, 0, 0, 0));
        when(userAchievementRepository.findByUserWithAchievement(USER_ID)).thenReturn(List.of());
        when(userAchievementRepository.insertIfAbsent(USER_ID, 1L)).thenReturn(0); // l'ha gia' scritta l'altra

        List<AchievementResponse> unlocked = achievementService.evaluate(USER_ID);

        assertThat(unlocked).isEmpty();
    }

    @Test
    void evaluateNeverUnlocksAnAchievementWithAnUnsupportedMetric() {
        Achievement mystery = achievement(9, "mystery", "unknown_metric", 1);
        when(achievementRepository.findByIsActiveTrueOrderByIdAsc()).thenReturn(List.of(mystery));

        // metrica non riconosciuta -> progress 0 -> mai sbloccato, anche con soglia 1
        List<AchievementResponse> unlocked = achievementService.evaluate(USER_ID);

        assertThat(unlocked).isEmpty();
        verify(userAchievementRepository, never()).insertIfAbsent(anyLong(), anyLong());
    }

    // ------------------------------------------------------------- helpers

    private static UserStatsResponse stats(long owned, long finished, long abandoned, long inProgress,
                                           long playtimeHours, long wishlist, long distinctGenres) {
        long neverPlayed = Math.max(0, owned - finished - abandoned - inProgress);
        List<UserStatsResponse.StatusBreakdown> byStatus = List.of(
                new UserStatsResponse.StatusBreakdown("mai_giocato", "Mai giocato", "Never played", neverPlayed),
                new UserStatsResponse.StatusBreakdown("in_corso", "In corso", "Playing", inProgress),
                new UserStatsResponse.StatusBreakdown("finito", "Finito", "Completed", finished),
                new UserStatsResponse.StatusBreakdown("abbandonato", "Abbandonato", "Abandoned", abandoned));
        return new UserStatsResponse(owned, wishlist, playtimeHours * 60, playtimeHours,
                distinctGenres, 0.0, byStatus, List.of());
    }

    private static Achievement achievement(long id, String code, String metric, int threshold) {
        try {
            Constructor<Achievement> constructor = Achievement.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            Achievement achievement = constructor.newInstance();
            setField(achievement, "id", id);
            setField(achievement, "code", code);
            setField(achievement, "nameIt", code + " IT");
            setField(achievement, "nameEn", code + " EN");
            setField(achievement, "metric", metric);
            setField(achievement, "threshold", threshold);
            setField(achievement, "points", (short) 0);
            setField(achievement, "isActive", Boolean.TRUE);
            return achievement;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Impossibile costruire un Achievement di test", e);
        }
    }

    private static UserAchievement unlock(Achievement achievement, LocalDateTime when) {
        UserAchievement ua = new UserAchievement();
        ua.setAchievement(achievement);
        setField(ua, "unlockedAt", when);
        return ua;
    }

    private static void setField(Object target, String name, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Campo non valorizzabile: " + name, e);
        }
    }
}
