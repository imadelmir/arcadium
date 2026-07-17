package com.ace5.arcadium.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Abilita lo scheduling dei job in modo INCONDIZIONATO (M6, feature auto-abbandono).
 *
 * <p>Serviva un punto di attivazione sempre attivo: lo scheduling era acceso solo
 * da {@code PriceDropNotificationConfig}, ma quello e' dietro feature flag
 * (spento di default), quindi a flag spento non partiva alcun job. L'auto-abbandono
 * deve invece girare sempre (per gli utenti che l'hanno attivato), percio' qui
 * {@link EnableScheduling} e' senza condizioni.
 *
 * <p>Avere {@code @EnableScheduling} in due configurazioni non crea conflitti:
 * Spring registra l'infrastruttura di scheduling una sola volta. Il job del
 * calo prezzo resta comunque {@code @ConditionalOnProperty} sul proprio bean,
 * quindi a flag spento non viene creato e non gira, anche con lo scheduling acceso.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
