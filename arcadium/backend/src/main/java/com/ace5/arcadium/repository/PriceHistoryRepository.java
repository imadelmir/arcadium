package com.ace5.arcadium.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ace5.arcadium.entity.PriceHistory;
import com.ace5.arcadium.entity.PriceHistoryId;

/**
 * Repository dello storico prezzi (chiave composta app_id+recorded_at).
 *
 * <p>save (ereditato) registra una rilevazione; la lettura dell'ultima
 * rilevazione di un gioco serve al motore delle notifiche di calo prezzo
 * (M4-T13) per confrontarla con il prezzo corrente.
 */
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, PriceHistoryId> {

    /**
     * Ultima rilevazione di prezzo per un gioco (recorded_at piu' recente).
     * Si usa con {@code PageRequest.of(0, 1)} e si prende il primo elemento.
     *
     * @param appId    gioco
     * @param pageable limite (tipicamente la sola prima riga)
     * @return le rilevazioni piu' recenti del gioco, dalla piu' nuova
     */
    @Query("select p from PriceHistory p where p.id.appId = :appId "
            + "order by p.id.recordedAt desc")
    List<PriceHistory> findLatest(@Param("appId") Long appId, Pageable pageable);
}
