package com.ace5.arcadium.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.Game;
import com.ace5.arcadium.entity.Notification;
import com.ace5.arcadium.entity.NotificationPreference;
import com.ace5.arcadium.entity.NotificationPreferenceId;
import com.ace5.arcadium.entity.PriceHistory;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.GameRepository;
import com.ace5.arcadium.repository.NotificationPreferenceRepository;
import com.ace5.arcadium.repository.NotificationRepository;
import com.ace5.arcadium.repository.PriceHistoryRepository;
import com.ace5.arcadium.repository.WishlistRepository;

/**
 * Test unitari del {@link PriceDropNotificationService} (M4-T13).
 *
 * <p>Verificano la logica del motore senza database (repository mockati) e a
 * prescindere dal feature flag (qui il service e' istanziato direttamente): la
 * prima rilevazione non notifica, un calo notifica gli utenti che hanno il gioco
 * in wishlist rispettando le preferenze, un prezzo invariato non registra ne'
 * notifica, un rialzo registra ma non notifica.
 */
@ExtendWith(MockitoExtension.class)
class PriceDropNotificationServiceTest {

    private static final Long APP_ID = 10L;

    @Mock
    private WishlistRepository wishlistRepository;
    @Mock
    private GameRepository gameRepository;
    @Mock
    private PriceHistoryRepository priceHistoryRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private NotificationPreferenceRepository preferenceRepository;
    @Mock
    private AppUserRepository userRepository;

    @InjectMocks
    private PriceDropNotificationService service;

    @BeforeEach
    void setUp() {
        lenient().when(wishlistRepository.findDistinctWishlistedAppIds()).thenReturn(List.of(APP_ID));
        lenient().when(priceHistoryRepository.findLatest(anyLong(), any(Pageable.class)))
                .thenReturn(List.of());
        lenient().when(preferenceRepository.findById(any(NotificationPreferenceId.class)))
                .thenReturn(Optional.empty());
        lenient().when(userRepository.getReferenceById(anyLong()))
                .thenAnswer(inv -> appUser(inv.getArgument(0)));
    }

    @Test
    void firstObservationRecordsSnapshotWithoutNotifying() {
        when(gameRepository.findById(APP_ID)).thenReturn(Optional.of(game(APP_ID, "Game", "20.00")));
        when(priceHistoryRepository.findLatest(eq(APP_ID), any(Pageable.class))).thenReturn(List.of());

        int created = service.evaluate();

        assertThat(created).isZero();
        verify(priceHistoryRepository).save(any(PriceHistory.class)); // registra la prima rilevazione
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void priceDropNotifiesWishlistersRespectingPreferences() {
        Game game = game(APP_ID, "Half-Life", "8.00");
        when(gameRepository.findById(APP_ID)).thenReturn(Optional.of(game));
        when(priceHistoryRepository.findLatest(eq(APP_ID), any(Pageable.class)))
                .thenReturn(List.of(priceSnapshot(game, "20.00")));
        when(wishlistRepository.findUserIdsByAppId(APP_ID)).thenReturn(List.of(1L, 2L));
        // utente 1: nessuna preferenza -> attivo di default; utente 2: disattivato
        when(preferenceRepository.findById(new NotificationPreferenceId(2L, "price_drop")))
                .thenReturn(Optional.of(new NotificationPreference(appUser(2L), "price_drop", false)));

        int created = service.evaluate();

        assertThat(created).isEqualTo(1);
        verify(priceHistoryRepository).save(any(PriceHistory.class)); // prezzo cambiato -> nuova rilevazione

        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(saved.capture());
        Notification notification = saved.getValue();
        assertThat(notification.getType()).isEqualTo("price_drop");
        assertThat(notification.getUser().getId()).isEqualTo(1L);
        assertThat(notification.getRelatedGame().getAppId()).isEqualTo(APP_ID);
        assertThat(notification.getIsRead()).isFalse();
        assertThat(notification.getMessage()).contains("Half-Life");
    }

    @Test
    void unchangedPriceNeitherRecordsNorNotifies() {
        Game game = game(APP_ID, "Game", "20.00");
        when(gameRepository.findById(APP_ID)).thenReturn(Optional.of(game));
        when(priceHistoryRepository.findLatest(eq(APP_ID), any(Pageable.class)))
                .thenReturn(List.of(priceSnapshot(game, "20.00")));

        int created = service.evaluate();

        assertThat(created).isZero();
        verify(priceHistoryRepository, never()).save(any(PriceHistory.class));
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void priceIncreaseRecordsSnapshotButDoesNotNotify() {
        Game game = game(APP_ID, "Game", "25.00");
        when(gameRepository.findById(APP_ID)).thenReturn(Optional.of(game));
        when(priceHistoryRepository.findLatest(eq(APP_ID), any(Pageable.class)))
                .thenReturn(List.of(priceSnapshot(game, "20.00")));

        int created = service.evaluate();

        assertThat(created).isZero();
        verify(priceHistoryRepository).save(any(PriceHistory.class)); // prezzo cambiato (salito)
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    // ------------------------------------------------------------- helpers

    private static Game game(long appId, String name, String price) {
        Game game = newInstance(Game.class);
        setField(game, "appId", appId);
        setField(game, "name", name);
        setField(game, "price", new BigDecimal(price));
        setField(game, "discount", (short) 0);
        return game;
    }

    private static AppUser appUser(long id) {
        AppUser user = newInstance(AppUser.class);
        setField(user, "id", id);
        return user;
    }

    private static PriceHistory priceSnapshot(Game game, String price) {
        return new PriceHistory(game, LocalDateTime.now(), new BigDecimal(price), (short) 0);
    }

    private static <T> T newInstance(Class<T> type) {
        try {
            Constructor<T> constructor = type.getDeclaredConstructor();
            constructor.setAccessible(true);
            return constructor.newInstance();
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Impossibile costruire " + type.getSimpleName(), e);
        }
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
