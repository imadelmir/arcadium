package com.ace5.arcadium.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import com.ace5.arcadium.dto.UserStatsResponse;
import com.ace5.arcadium.entity.BacklogStatus;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.BacklogRepository;
import com.ace5.arcadium.repository.BacklogStatusRepository;
import com.ace5.arcadium.repository.PlaytimeEntryRepository;
import com.ace5.arcadium.repository.WishlistRepository;

/**
 * Test unitari del {@link StatsService} (M4-T10, esteso in M6).
 *
 * <p>Verificano la logica di aggregazione senza database: i repository sono
 * mockati (Mockito) e restituiscono valori aggregati finti. Si controlla che il
 * service componga correttamente le statistiche a partire da quei valori:
 * conteggio del posseduto dalla ripartizione, riempimento a zero degli stati
 * mancanti nell'ordine del seed, conversione minuti->ore, tasso di completamento
 * (senza divisione per zero), mappatura dei top generi e — feature M6 — la
 * regola del totale ore ("Steam vince") e la serie "ore per mese" (sempre 12
 * bucket in ordine, riempiti a zero).
 *
 * <p>Il comportamento sulle query (JPQL, fetch, join) e' invece verificato
 * empiricamente sull'istanza reale, come per gli altri endpoint (vedi la sezione
 * "Esito della verifica" del documento di task).
 */
@ExtendWith(MockitoExtension.class)
class StatsServiceTest {

    private static final Long USER_ID = 42L;

    @Mock
    private BacklogRepository backlogRepository;

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private BacklogStatusRepository statusRepository;

    @Mock
    private PlaytimeEntryRepository playtimeRepository;

    @Mock
    private AppUserRepository userRepository;

    @InjectMocks
    private StatsService statsService;

    /**
     * Default "utente con libreria vuota, Steam NON collegato": ogni test
     * sovrascrive solo cio' che gli serve. lenient() evita
     * UnnecessaryStubbingException sui default non usati.
     */
    @BeforeEach
    void setUp() {
        lenient().when(backlogRepository.countByStatus(USER_ID)).thenReturn(List.of());
        lenient().when(backlogRepository.sumPlaytimeMinutes(USER_ID)).thenReturn(0L);
        lenient().when(backlogRepository.countDistinctGenres(USER_ID)).thenReturn(0L);
        lenient().when(backlogRepository.topGenres(eq(USER_ID), any(Pageable.class))).thenReturn(List.of());
        lenient().when(wishlistRepository.countByUser(USER_ID)).thenReturn(0L);
        lenient().when(statusRepository.findAllByOrderBySortOrderAsc()).thenReturn(fourStatuses());
        // feature M6: Steam scollegato -> totale dal registro manuale (0 di default)
        lenient().when(userRepository.isSteamConnected(USER_ID)).thenReturn(false);
        lenient().when(playtimeRepository.sumMinutesByUser(USER_ID)).thenReturn(0L);
        lenient().when(playtimeRepository.monthlyMinutes(eq(USER_ID), any(LocalDate.class))).thenReturn(List.of());
        // top giochi: vuoti di default, dalla sorgente coerente con "Steam vince"
        lenient().when(playtimeRepository.topPlayedGames(eq(USER_ID), any(Pageable.class))).thenReturn(List.of());
        lenient().when(backlogRepository.topPlayedGames(eq(USER_ID), any(Pageable.class))).thenReturn(List.of());
    }

    /**
     * Senza Steam la sorgente dichiarata e' il registro manuale: e' il campo su
     * cui il frontend decide se ha senso mostrare la serie mensile o la classifica
     * dei giochi. La decisione sta qui, dove si conosce la provenienza del dato.
     */
    @Test
    void playtimeSourceIsManualWhenSteamIsNotConnected() {
        UserStatsResponse stats = statsService.getStats(USER_ID);

        assertThat(stats.playtimeSource()).isEqualTo("manual");
        verify(playtimeRepository).topPlayedGames(eq(USER_ID), any(Pageable.class));
        verify(backlogRepository, never()).topPlayedGames(eq(USER_ID), any(Pageable.class));
    }

    /**
     * Con Steam collegato i top giochi arrivano dal tempo sincronizzato, come il
     * totale: le due grandezze non devono poter raccontare storie diverse.
     */
    @Test
    void topGamesComeFromSteamPlaytimeWhenConnected() {
        when(userRepository.isSteamConnected(USER_ID)).thenReturn(true);
        when(backlogRepository.topPlayedGames(eq(USER_ID), any(Pageable.class)))
                .thenReturn(List.of(gamePlaytime(10L, "Hollow Knight", "cover.jpg", 4200L)));

        UserStatsResponse stats = statsService.getStats(USER_ID);

        assertThat(stats.playtimeSource()).isEqualTo("steam");
        assertThat(stats.topGames()).hasSize(1);
        UserStatsResponse.TopGame top = stats.topGames().get(0);
        assertThat(top.appId()).isEqualTo(10L);
        assertThat(top.name()).isEqualTo("Hollow Knight");
        assertThat(top.minutes()).isEqualTo(4200L);
        assertThat(top.hours()).isEqualTo(70L); // 4200 / 60, troncate
        verify(playtimeRepository, never()).topPlayedGames(eq(USER_ID), any(Pageable.class));
    }

    /** Il grafico dei top giochi si ferma a dieci voci, come quello dei generi. */
    @Test
    void topGamesQueryIsLimitedToTenFromFirstPage() {
        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);

        statsService.getStats(USER_ID);

        verify(playtimeRepository).topPlayedGames(eq(USER_ID), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(pageable.getValue().getPageSize()).isEqualTo(10);
    }

    /** Riga di proiezione "gioco + minuti" per i test dei top giochi. */
    private static BacklogRepository.GamePlaytime gamePlaytime(
            Long appId, String name, String headerImage, long minutes) {
        return new BacklogRepository.GamePlaytime() {
            @Override public Long getAppId() { return appId; }
            @Override public String getName() { return name; }
            @Override public String getHeaderImage() { return headerImage; }
            @Override public long getMinutes() { return minutes; }
        };
    }

    @Test
    void ownedIsSumOfBreakdownAndMissingStatusesAreFilledWithZeroInOrder() {
        when(backlogRepository.countByStatus(USER_ID)).thenReturn(List.of(
                statusCount("mai_giocato", 2),
                statusCount("finito", 3)));
        // in_corso e abbandonato assenti: devono comparire a zero, nell'ordine del seed.

        UserStatsResponse stats = statsService.getStats(USER_ID);

        assertThat(stats.gamesOwned()).isEqualTo(5);
        assertThat(stats.byStatus())
                .extracting(UserStatsResponse.StatusBreakdown::code)
                .containsExactly("mai_giocato", "in_corso", "finito", "abbandonato");
        assertThat(stats.byStatus())
                .extracting(UserStatsResponse.StatusBreakdown::count)
                .containsExactly(2L, 0L, 3L, 0L);
        // etichette bilingue propagate dalla lookup
        assertThat(stats.byStatus().get(2).labelIt()).isEqualTo("Finito");
        assertThat(stats.byStatus().get(2).labelEn()).isEqualTo("Completed");
    }

    @Test
    void steamConnectedTotalComesFromSteamPlaytimeAndCompletionRateIsComputed() {
        // "Steam vince": collegato -> il totale ore e' quello sincronizzato (backlog).
        when(userRepository.isSteamConnected(USER_ID)).thenReturn(true);
        when(backlogRepository.sumPlaytimeMinutes(USER_ID)).thenReturn(605L); // 10h e 5 min
        when(backlogRepository.countByStatus(USER_ID)).thenReturn(List.of(
                statusCount("finito", 3),
                statusCount("in_corso", 2))); // 5 posseduti, 3 finiti -> 0.6

        UserStatsResponse stats = statsService.getStats(USER_ID);

        assertThat(stats.playtimeMinutes()).isEqualTo(605);
        assertThat(stats.playtimeHours()).isEqualTo(10); // troncamento
        assertThat(stats.completionRate()).isCloseTo(0.6, within(1e-9));
    }

    @Test
    void manualPlaytimeTotalIsUsedWhenSteamNotConnected() {
        // Steam scollegato (default): il totale ore e' la somma delle voci manuali.
        when(playtimeRepository.sumMinutesByUser(USER_ID)).thenReturn(605L); // 10h e 5 min

        UserStatsResponse stats = statsService.getStats(USER_ID);

        assertThat(stats.playtimeMinutes()).isEqualTo(605);
        assertThat(stats.playtimeHours()).isEqualTo(10);
    }

    @Test
    void monthlyBreakdownAlwaysHasTwelveOrderedBucketsFilledWithZeroByDefault() {
        UserStatsResponse stats = statsService.getStats(USER_ID);

        assertThat(stats.monthly()).hasSize(12);
        assertThat(stats.monthly()).allSatisfy(m -> assertThat(m.minutes()).isZero());
        // ordine cronologico (anno*12 + mese, crescente)
        assertThat(stats.monthly())
                .extracting(m -> m.year() * 12 + m.month())
                .isSorted();
        // l'ultimo bucket e' il mese corrente
        LocalDate now = LocalDate.now();
        UserStatsResponse.MonthlyPlaytime last = stats.monthly().get(11);
        assertThat(last.year()).isEqualTo(now.getYear());
        assertThat(last.month()).isEqualTo(now.getMonthValue());
    }

    @Test
    void emptyLibraryYieldsZeroesAndNoDivisionByZero() {
        UserStatsResponse stats = statsService.getStats(USER_ID);

        assertThat(stats.gamesOwned()).isZero();
        assertThat(stats.wishlistSize()).isZero();
        assertThat(stats.playtimeMinutes()).isZero();
        assertThat(stats.playtimeHours()).isZero();
        assertThat(stats.distinctGenres()).isZero();
        assertThat(stats.completionRate()).isZero(); // niente ArithmeticException
        assertThat(stats.topGenres()).isEmpty();
        // gli stati compaiono comunque tutti e quattro, a zero
        assertThat(stats.byStatus()).hasSize(4)
                .allSatisfy(section -> assertThat(section.count()).isZero());
    }

    @Test
    void distinctGenresWishlistSizeAndTopGenresArePassedThrough() {
        when(wishlistRepository.countByUser(USER_ID)).thenReturn(12L);
        when(backlogRepository.countDistinctGenres(USER_ID)).thenReturn(5L);
        when(backlogRepository.topGenres(eq(USER_ID), any(Pageable.class))).thenReturn(List.of(
                genreCount("Action", 10),
                genreCount("RPG", 7)));

        UserStatsResponse stats = statsService.getStats(USER_ID);

        assertThat(stats.wishlistSize()).isEqualTo(12);
        assertThat(stats.distinctGenres()).isEqualTo(5);
        assertThat(stats.topGenres())
                .extracting(UserStatsResponse.TopGenre::name)
                .containsExactly("Action", "RPG"); // ordine preservato
        assertThat(stats.topGenres().get(0).count()).isEqualTo(10);
    }

    @Test
    void topGenresQueryIsLimitedToTenFromFirstPage() {
        statsService.getStats(USER_ID);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(backlogRepository).topGenres(eq(USER_ID), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(pageable.getValue().getPageSize()).isEqualTo(10);
    }

    // ------------------------------------------------------------- helpers

    private static List<BacklogStatus> fourStatuses() {
        return List.of(
                status("mai_giocato", "Mai giocato", "Never played"),
                status("in_corso", "In corso", "Playing"),
                status("finito", "Finito", "Completed"),
                status("abbandonato", "Abbandonato", "Abandoned"));
    }

    /**
     * Costruisce un {@link BacklogStatus} reale con i valori dati. L'entità e'
     * immutabile (nessun setter, costruttore protetto), quindi i campi si
     * valorizzano via reflection: cosi' si evita di mockare l'entita' (che
     * confonde Mockito) e si usano oggetti veri.
     */
    private static BacklogStatus status(String code, String labelIt, String labelEn) {
        try {
            Constructor<BacklogStatus> constructor = BacklogStatus.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            BacklogStatus status = constructor.newInstance();
            setField(status, "code", code);
            setField(status, "labelIt", labelIt);
            setField(status, "labelEn", labelEn);
            return status;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Impossibile costruire un BacklogStatus di test", e);
        }
    }

    private static void setField(Object target, String name, Object value)
            throws ReflectiveOperationException {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static BacklogRepository.StatusCount statusCount(String code, long count) {
        return new BacklogRepository.StatusCount() {
            @Override
            public String getCode() {
                return code;
            }

            @Override
            public long getCount() {
                return count;
            }
        };
    }

    private static BacklogRepository.GenreCount genreCount(String name, long count) {
        return new BacklogRepository.GenreCount() {
            @Override
            public String getName() {
                return name;
            }

            @Override
            public long getCount() {
                return count;
            }
        };
    }
}
