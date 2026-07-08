package com.ace5.arcadium.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.BacklogStatus;

/**
 * Repository della lookup stati del backlog (seed R__backlog_status.sql).
 *
 * <p>Espone il lookup per codice (validazione dello stato richiesto dall'API,
 * M4-T8) e l'elenco ordinato per {@code sort_order} (dropdown degli stati nel
 * frontend, M5-T11). La tabella e' di sola lettura per il backend.
 */
public interface BacklogStatusRepository extends JpaRepository<BacklogStatus, Long> {

    /**
     * Cerca uno stato per il suo codice stabile ('mai_giocato', 'in_corso', ...).
     *
     * @param code codice dello stato
     * @return lo stato, se esiste
     */
    Optional<BacklogStatus> findByCode(String code);

    /**
     * Tutti gli stati nell'ordine di visualizzazione previsto dal seed
     * (mai giocato -> in corso -> finito -> abbandonato).
     *
     * @return stati ordinati per sort_order crescente
     */
    List<BacklogStatus> findAllByOrderBySortOrderAsc();
}
