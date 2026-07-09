package com.ace5.arcadium.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
 * Motore delle notifiche di calo prezzo (M4-T13) — <strong>future-ready, dietro
 * feature flag SPENTO</strong>.
 *
 * <p>La funzione esiste ma non e' attiva: questo bean viene creato solo quando
 * {@code arcadium.notifications.price-drop.enabled=true} (default: false, vedi
 * {@code @ConditionalOnProperty}). A flag spento nessun bean del pacchetto
 * notifiche di prezzo viene istanziato e non gira nulla — il resto dell'app e'
 * identico. L'attivazione vera avra' senso quando arriveranno prezzi aggiornati
 * dalla sync Steam (M4-T16); qui si predispone il meccanismo.
 *
 * <p>Ad ogni esecuzione, per ogni gioco presente in almeno una wishlist:
 * confronta il prezzo corrente ({@code games.price}) con l'ultima rilevazione in
 * {@code price_history}; se il prezzo e' cambiato registra una nuova rilevazione;
 * se e' <em>sceso</em>, crea una notifica {@code price_drop} per ogni utente che
 * ha il gioco in wishlist e non ha disattivato quel tipo di notifica
 * ({@code notification_preference}; assente = attivo, come il default di schema).
 *
 * <p>Idempotente per livello di prezzo: poiche' una rilevazione si registra solo
 * al cambio, una riesecuzione a prezzo invariato non genera nuove notifiche.
 */
@Service
@ConditionalOnProperty(prefix = "arcadium.notifications.price-drop", name = "enabled", havingValue = "true")
public class PriceDropNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PriceDropNotificationService.class);

    /** Tipo di notifica e chiave di preferenza (M1-T7 §8, TEXT libero). */
    private static final String TYPE_PRICE_DROP = "price_drop";

    private final WishlistRepository wishlistRepository;
    private final GameRepository gameRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final AppUserRepository userRepository;

    public PriceDropNotificationService(WishlistRepository wishlistRepository,
                                        GameRepository gameRepository,
                                        PriceHistoryRepository priceHistoryRepository,
                                        NotificationRepository notificationRepository,
                                        NotificationPreferenceRepository preferenceRepository,
                                        AppUserRepository userRepository) {
        this.wishlistRepository = wishlistRepository;
        this.gameRepository = gameRepository;
        this.priceHistoryRepository = priceHistoryRepository;
        this.notificationRepository = notificationRepository;
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }

    /**
     * Esegue un ciclo di rilevazione e notifica sui giochi in wishlist.
     *
     * @return numero di notifiche di calo prezzo create in questa esecuzione
     */
    @Transactional
    public int evaluate() {
        LocalDateTime now = LocalDateTime.now();
        int created = 0;

        for (Long appId : wishlistRepository.findDistinctWishlistedAppIds()) {
            Game game = gameRepository.findById(appId).orElse(null);
            if (game == null || game.getPrice() == null) {
                continue;
            }
            BigDecimal current = game.getPrice();
            BigDecimal previous = latestPrice(appId);

            // Registra una rilevazione solo quando il prezzo cambia (o e' la prima).
            if (previous == null || previous.compareTo(current) != 0) {
                priceHistoryRepository.save(new PriceHistory(game, now, current, game.getDiscount()));
            }

            // Notifica solo se c'era un prezzo precedente ed e' sceso.
            if (previous != null && current.compareTo(previous) < 0) {
                created += notifyWishlisters(game, previous, current);
            }
        }

        if (created > 0) {
            log.info("Notifiche di calo prezzo create: {}", created);
        }
        return created;
    }

    private int notifyWishlisters(Game game, BigDecimal previous, BigDecimal current) {
        int created = 0;
        String message = String.format("Prezzo in calo per \"%s\": da %s a %s",
                game.getName(), previous, current);

        for (Long userId : wishlistRepository.findUserIdsByAppId(game.getAppId())) {
            if (!priceDropEnabled(userId)) {
                continue;
            }
            AppUser user = userRepository.getReferenceById(userId);
            Notification notification = new Notification();
            notification.setUser(user);
            notification.setType(TYPE_PRICE_DROP);
            notification.setMessage(message);
            notification.setIsRead(false);
            notification.setRelatedGame(game);
            notificationRepository.save(notification);
            created++;
        }
        return created;
    }

    /** Prezzo dell'ultima rilevazione del gioco, o null se non ce n'e' ancora. */
    private BigDecimal latestPrice(Long appId) {
        List<PriceHistory> latest = priceHistoryRepository.findLatest(appId, PageRequest.of(0, 1));
        return latest.isEmpty() ? null : latest.get(0).getPrice();
    }

    /** True se l'utente non ha disattivato le notifiche di calo prezzo (assente = attivo). */
    private boolean priceDropEnabled(Long userId) {
        Optional<NotificationPreference> preference =
                preferenceRepository.findById(new NotificationPreferenceId(userId, TYPE_PRICE_DROP));
        return preference.map(NotificationPreference::getEnabled).orElse(Boolean.TRUE);
    }
}
