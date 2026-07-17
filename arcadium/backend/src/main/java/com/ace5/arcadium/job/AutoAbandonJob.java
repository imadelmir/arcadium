package com.ace5.arcadium.job;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.ace5.arcadium.service.AutoAbandonService;

/**
 * Job giornaliero di auto-abbandono (change request, feature M6).
 *
 * <p>Ogni giorno passa ad "Abbandonato" i giochi "In corso" inattivi oltre la
 * soglia scelta da ciascun utente. La cadenza e' configurabile
 * ({@code arcadium.auto-abandon.cron}, default alle 03:00): per una prova rapida
 * si puo' impostare, ad es., {@code 0 * * * * *} (ogni minuto).
 *
 * <p>Lo scheduling e' abilitato da {@code SchedulingConfig} (incondizionato):
 * questo job gira indipendentemente dal feature flag del calo prezzo.
 */
@Component
public class AutoAbandonJob {

    private static final Logger log = LoggerFactory.getLogger(AutoAbandonJob.class);

    private final AutoAbandonService service;

    public AutoAbandonJob(AutoAbandonService service) {
        this.service = service;
    }

    @Scheduled(cron = "${arcadium.auto-abandon.cron:0 0 3 * * *}")
    public void run() {
        int updated = service.abandonInactiveGames();
        log.debug("Job auto-abbandono eseguito ({} aggiornati).", updated);
    }
}
