package com.ace5.arcadium.job;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.ace5.arcadium.service.PriceDropNotificationService;

/**
 * Job schedulato che innesca il motore delle notifiche di calo prezzo (M4-T13).
 *
 * <p>Come il service, esiste solo a feature flag acceso
 * ({@code @ConditionalOnProperty}); lo scheduling e' abilitato da
 * {@code PriceDropNotificationConfig}, anch'esso condizionato. A flag spento
 * questo bean non viene creato e non e' schedulato nulla.
 *
 * <p>La cadenza e' configurabile ({@code arcadium.notifications.price-drop.cron},
 * default: ogni notte alle 03:00). Il job non contiene logica: delega tutto al
 * service, in una transazione per esecuzione.
 */
@Component
@ConditionalOnProperty(prefix = "arcadium.notifications.price-drop", name = "enabled", havingValue = "true")
public class PriceDropNotificationJob {

    private static final Logger log = LoggerFactory.getLogger(PriceDropNotificationJob.class);

    private final PriceDropNotificationService service;

    public PriceDropNotificationJob(PriceDropNotificationService service) {
        this.service = service;
    }

    /** Esecuzione periodica: rileva i prezzi dei giochi in wishlist e notifica i cali. */
    @Scheduled(cron = "${arcadium.notifications.price-drop.cron:0 0 3 * * *}")
    public void run() {
        log.debug("Avvio ciclo notifiche di calo prezzo");
        int created = service.evaluate();
        log.debug("Ciclo notifiche di calo prezzo completato: {} notifiche", created);
    }
}
