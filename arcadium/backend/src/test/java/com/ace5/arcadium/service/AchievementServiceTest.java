package com.ace5.arcadium.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ace5.arcadium.dto.AchievementResponse;
import com.ace5.arcadium.dto.UserStatsResponse;
import com.ace5.arcadium.entity.Achievement;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.UserAchievement;
import com.ace5.arcadium.repository.AchievementRepository;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.UserAchievementRepository;

/**
 * Test unitari del {@link AchievementService} (M4-T11).
 *
 * <p>Verificano la logica del motore data-driven senza database: repository e
 * {@link StatsService} sono mockati. Si controlla che le metriche siano derivate
 * dall'aggregato delle statistiche (compresi i conteggi per stato), che lo
 * sblocco scatti al raggiungimento della soglia, che sia idempotente (niente
 * ri-sblocco dei badge gia' presenti) e robusto verso metriche non supportate.
 *
 * <p>Il comportamento sulle query e la persistenza reale degli sblocchi sono
 * verificati empiricamente sull'istanza (vedi "Esito della verifica" del doc).
 */
@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    private static final Long USER_ID = 42L;
    private static final LocalDateTime UNLOCK_TIME = LocalDateTime.of(2026, 7, 8, 12, 0);

    @Mock
    private AchievementRepository achievementRepository;

    @Mock
    private UserAchievementRepository userAchievementRepository;

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private StatsService statsService;

    @InjectMocks
    private AchievementService achievementService;

    /** Default "utente vuoto, niente sblocchi": ogni test sovrascrive cio' che gli serve. */
    @BeforeEach
    void setUp() {
        lenient().when(statsService.getStats(USER_ID)).thenReturn(stats(0, 0, 0, 0, 0, 0, 0));
        lenient().when(userAchievementRepository.findByUserWithAchievement(USER_ID)).thenReturn(List.of());
        lenient().when(achievementRepository.findByIsActiveTrueOrderByIdAsc()).thenReturn(List.of());
        lenient().when(userRepository.getReferenceById(USER_ID)).thenReturn(appUser(USER_ID));
        lenient().when(userAchievementRepository.saveAndFlush(any(UserAchievement.class)))
                .thenAnswer(invocation -> {
                    UserAchievement ua = invocation.getArgument(0);
                    setField(ua, "unlockedAt", UNLOCK_TIME);
                    return ua;
                });
    }

    @Test
    void listMarksUnlockedComputesProgressAndDerivesFinishedFromByStatus() {
        Achievement firstGame = achievement(1, "first_game", "games_owned", 1);
        Achievement collector = achievement(2, "collector_50", "games_owned", 50);
        Achievement finisher = achievement(3, "finisher_10", "games_finished", 10);
        when(achievementRepository.findByIsActiveTrueOrderByIdAsc())
                .thenReturn(List.of(firstGame, collector, finisher));
        // 5 posseduti, 3 finiti (dallo stato 'finito'); first_game gia' sbloccato
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
                .thenReturn(List.of(unlock(firstGame, UNLOCK_TIME)));

        List<AchievementResponse> unlocked = achievementService.evaluate(USER_ID);

        // Sblocca solo collector_50
        ArgumentCaptor<UserAchievement> saved = ArgumentCaptor.forClass(UserAchievement.class);
        verify(userAchievementRepository).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getAchievement().getCode()).isEqualTo("collector_50");

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
        verify(userAchievementRepository, never()).saveAndFlush(any(UserAchievement.class));
    }

    @Test
    void evaluateNeverUnlocksAnAchievementWithAnUnsupportedMetric() {
        Achievement mystery = achievement(9, "mystery", "unknown_metric", 1);
        when(achievementRepository.findByIsActiveTrueOrderByIdAsc()).thenReturn(List.of(mystery));
        // metrica non riconosciuta -> progress 0 -> mai sbloccato, anche con soglia 1

        List<AchievementResponse> unlocked = achievementService.evaluate(USER_ID);

        assertThat(unlocked).isEmpty();
        verify(userAchievementRepository, never()).saveAndFlush(any(UserAchievement.class));
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

    private static AppUser appUser(long id) {
        try {
            Constructor<AppUser> constructor = AppUser.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            AppUser user = constructor.newInstance();
            setField(user, "id", id);
            return user;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Impossibile costruire un AppUser di test", e);
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
