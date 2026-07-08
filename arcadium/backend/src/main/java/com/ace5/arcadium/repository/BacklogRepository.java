package com.ace5.arcadium.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ace5.arcadium.entity.Backlog;
import com.ace5.arcadium.entity.BacklogId;

/**
 * Repository del backlog (chiave composta user_id+app_id).
 *
 * <p>save/existsById/findById/deleteById (ereditati, chiave {@link BacklogId})
 * coprono aggiunta, aggiornamento e rimozione (M4-T8). La lettura del backlog di
 * un utente usa query con fetch join su gioco e stato, per evitare l'N+1 quando
 * ogni voce viene proiettata in DTO (che legge sia il gioco sia le etichette
 * dello stato).
 */
public interface BacklogRepository extends JpaRepository<Backlog, BacklogId> {

    /**
     * Backlog completo di un utente, dal piu' recente al piu' vecchio, con gioco
     * e stato gia' caricati per la proiezione in {@code BacklogItemResponse}.
     *
     * @param userId id dell'utente proprietario del backlog
     * @return voci del backlog dell'utente, ordinate per data di aggiunta discendente
     */
    @Query("select b from Backlog b join fetch b.game join fetch b.status "
            + "where b.user.id = :userId order by b.addedAt desc")
    List<Backlog> findByUserWithGame(@Param("userId") Long userId);

    /**
     * Backlog di un utente filtrato per stato (sezioni in corso/finito/abbandonato),
     * con gioco e stato caricati via fetch join.
     *
     * @param userId     id dell'utente proprietario del backlog
     * @param statusCode codice dello stato ('in_corso', 'finito', ...)
     * @return voci del backlog dell'utente in quello stato, dalla piu' recente
     */
    @Query("select b from Backlog b join fetch b.game join fetch b.status s "
            + "where b.user.id = :userId and s.code = :statusCode order by b.addedAt desc")
    List<Backlog> findByUserAndStatusWithGame(@Param("userId") Long userId,
                                              @Param("statusCode") String statusCode);
}
