package com.ace5.arcadium.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.repository.BacklogRepository;

/**
 * Auto-abbandono dei giochi inattivi (change request, feature M6).
 *
 * <p>I giochi in stato "In corso" che non registrano attivita' da piu' mesi di
 * quelli scelti dall'utente passano ad "Abbandonato". Solo lo stato cambia: il
 * gioco resta in libreria. L'inattivita' e' misurata sul segnale piu' recente
 * tra: aggiunta al backlog, passaggio a "In corso" e ultima ora registrata a
 * mano ({@code playtime_entry}). Cosi' un gioco su cui l'utente carica ore resta
 * "attivo" anche senza un vero segnale di avvio (che Arcadium non traccia).
 *
 * <p>L'aggiornamento e' un UPDATE massivo unico (nessun ciclo per-utente, nessun
 * ID di stato cablato: gli stati sono risolti per codice), avviato dal job
 * giornaliero {@code AutoAbandonJob}.
 */
@Service
public class AutoAbandonService {

    private static final Logger log = LoggerFactory.getLogger(AutoAbandonService.class);

    private final BacklogRepository backlogRepository;

    public AutoAbandonService(BacklogRepository backlogRepository) {
        this.backlogRepository = backlogRepository;
    }

    /**
     * Applica l'auto-abbandono a tutti gli utenti che l'hanno attivato.
     *
     * @return numero di giochi passati ad "Abbandonato"
     */
    @Transactional
    public int abandonInactiveGames() {
        int updated = backlogRepository.abandonInactiveInProgressGames();
        if (updated > 0) {
            log.info("Auto-abbandono: {} giochi passati ad Abbandonato.", updated);
        }
        return updated;
    }
}
