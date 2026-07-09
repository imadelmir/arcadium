package com.ace5.arcadium.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Attivazione della funzione "notifiche di calo prezzo" (M4-T13) dietro feature
 * flag SPENTO di default.
 *
 * <p>Questa configurazione — e con essa lo scheduling ({@link EnableScheduling})
 * — viene caricata SOLO quando {@code arcadium.notifications.price-drop.enabled=true}.
 * A flag spento non si abilita lo scheduling e i bean della funzione
 * ({@code PriceDropNotificationService}, {@code PriceDropNotificationJob}), a loro
 * volta condizionati, non vengono creati: il comportamento dell'app non cambia.
 *
 * <p>E' l'unico punto in cui si accende lo scheduling: l'applicazione non usa
 * {@code @Scheduled} altrove, quindi a flag spento non parte alcun job.
 */
@Configuration
@ConditionalOnProperty(prefix = "arcadium.notifications.price-drop", name = "enabled", havingValue = "true")
@EnableScheduling
public class PriceDropNotificationConfig {
}
