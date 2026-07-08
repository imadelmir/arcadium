package com.ace5.arcadium.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
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
 *
 * <p>Per le statistiche personali (M4-T10) si aggiungono query <em>aggregate</em>
 * che calcolano i totali nel database (conteggio per stato, somma del tempo di
 * gioco, generi distinti, top generi) senza caricare le righe in memoria.
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

    // ------------------------------------------------------------- statistiche (M4-T10)

    /**
     * Conteggio dei giochi posseduti raggruppati per codice di stato. Compaiono
     * solo gli stati effettivamente presenti nel backlog dell'utente (il service
     * completa con gli stati mancanti a zero).
     *
     * @param userId id dell'utente
     * @return coppie (codice stato, conteggio)
     */
    @Query("select s.code as code, count(b) as count "
            + "from Backlog b join b.status s "
            + "where b.user.id = :userId group by s.code")
    List<StatusCount> countByStatus(@Param("userId") Long userId);

    /**
     * Somma del tempo di gioco (in minuti) su tutto il backlog dell'utente.
     * {@code coalesce} garantisce 0 (mai null) quando non ci sono valori.
     *
     * @param userId id dell'utente
     * @return minuti di gioco totali (0 se assenti)
     */
    @Query("select coalesce(sum(b.playtimeMinutes), 0) "
            + "from Backlog b where b.user.id = :userId")
    long sumPlaytimeMinutes(@Param("userId") Long userId);

    /**
     * Numero di generi distinti fra i giochi posseduti dall'utente (join sulla
     * ponte game_genre attraverso il gioco).
     *
     * @param userId id dell'utente
     * @return numero di generi distinti
     */
    @Query("select count(distinct g.id) "
            + "from Backlog b join b.game gm join gm.genres g "
            + "where b.user.id = :userId")
    long countDistinctGenres(@Param("userId") Long userId);

    /**
     * Generi piu' frequenti fra i giochi posseduti, dal piu' numeroso. Il limite
     * (top N) si passa via {@link Pageable} ({@code PageRequest.of(0, N)}).
     *
     * @param userId   id dell'utente
     * @param pageable pagina/limite dei generi da restituire
     * @return coppie (nome genere, numero di giochi posseduti di quel genere)
     */
    @Query("select g.name as name, count(b) as count "
            + "from Backlog b join b.game gm join gm.genres g "
            + "where b.user.id = :userId group by g.name order by count(b) desc")
    List<GenreCount> topGenres(@Param("userId") Long userId, Pageable pageable);

    // ------------------------------------------------------------- proiezioni

    /**
     * Proiezione (interface projection) di una riga "codice stato + conteggio"
     * della ripartizione per stato.
     */
    interface StatusCount {
        String getCode();

        long getCount();
    }

    /**
     * Proiezione (interface projection) di una riga "genere + conteggio" dei
     * generi piu' frequenti.
     */
    interface GenreCount {
        String getName();

        long getCount();
    }
}
