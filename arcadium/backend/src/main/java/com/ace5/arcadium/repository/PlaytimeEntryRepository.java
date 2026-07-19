package com.ace5.arcadium.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ace5.arcadium.entity.PlaytimeEntry;

/**
 * Accesso alle sessioni di gioco dichiarate manualmente ({@link PlaytimeEntry}).
 *
 * <p>Tutte le query sono "scoped" all'utente autenticato (mai un parametro dal
 * client), coerente con backlog/wishlist/stats. Le aggregazioni sono fatte nel
 * DB (SUM/GROUP BY), non caricando le righe in memoria, come per le statistiche
 * (M4-T10).
 */
public interface PlaytimeEntryRepository extends JpaRepository<PlaytimeEntry, Long> {

    /** Voci di un gioco per l'utente, dalla piu' recente (per la lista nella card backlog). */
    List<PlaytimeEntry> findByUser_IdAndGame_AppIdOrderByPlayedOnDescIdDesc(Long userId, Long appId);

    /** Totale manuale (minuti) su tutta la libreria dell'utente. 0 se nessuna voce. */
    @Query("SELECT COALESCE(SUM(p.minutes), 0) FROM PlaytimeEntry p WHERE p.user.id = :userId")
    long sumMinutesByUser(@Param("userId") Long userId);

    /** Totale manuale (minuti) su un singolo gioco dell'utente. 0 se nessuna voce. */
    @Query("""
            SELECT COALESCE(SUM(p.minutes), 0)
            FROM PlaytimeEntry p
            WHERE p.user.id = :userId AND p.game.appId = :appId
            """)
    long sumMinutesByUserAndGame(@Param("userId") Long userId, @Param("appId") Long appId);

    /**
     * Somma dei minuti manuali PER GIOCO, per un utente (feature M6): la usano le
     * liste backlog/libreria per mostrare le ore registrate a mano su ogni gioco
     * con UNA sola query (niente N+1). Proiezione appId -> minuti; compaiono solo
     * i giochi con almeno una voce.
     */
    @Query("""
            SELECT p.game.appId AS appId, SUM(p.minutes) AS minutes
            FROM PlaytimeEntry p
            WHERE p.user.id = :userId
            GROUP BY p.game.appId
            """)
    List<GameMinutes> sumMinutesByGameForUser(@Param("userId") Long userId);

    /**
     * Minuti totali per (anno, mese) dell'utente, dalla data indicata in poi.
     * Alimenta il grafico "ore per mese" (ultimi 12 mesi). Query nativa per
     * usare EXTRACT sul tipo DATE; proiezione mappata per alias di colonna.
     */
    @Query(value = """
            SELECT EXTRACT(YEAR  FROM played_on)::int AS yr,
                   EXTRACT(MONTH FROM played_on)::int AS mo,
                   SUM(minutes)                       AS minutes
            FROM playtime_entry
            WHERE user_id = :userId
              AND played_on >= :fromDate
            GROUP BY yr, mo
            ORDER BY yr, mo
            """, nativeQuery = true)
    List<MonthlyMinutes> monthlyMinutes(@Param("userId") Long userId,
                                        @Param("fromDate") LocalDate fromDate);

    /**
     * Giochi piu' giocati secondo il registro manuale, dal piu' giocato.
     *
     * <p>Gemella di {@code BacklogRepository.topPlayedGames}: alimenta lo stesso
     * grafico quando Steam non e' collegato, cosi' il pannello "top giochi" ha
     * dati in entrambi i casi e la regola "Steam vince" resta l'unica differenza.
     *
     * @param userId   id dell'utente
     * @param pageable pagina/limite dei giochi da restituire
     * @return righe (appId, nome, copertina, minuti) ordinate per minuti discendenti
     */
    @Query("select g.appId as appId, g.name as name, g.headerImage as headerImage, "
            + "sum(p.minutes) as minutes "
            + "from PlaytimeEntry p join p.game g "
            + "where p.user.id = :userId "
            + "group by g.appId, g.name, g.headerImage "
            + "order by sum(p.minutes) desc")
    List<GamePlaytimeRow> topPlayedGames(@Param("userId") Long userId, Pageable pageable);

    /** Proiezione riga "gioco + minuti manuali" del grafico dei top giochi. */
    interface GamePlaytimeRow {
        Long getAppId();

        String getName();

        String getHeaderImage();

        long getMinutes();
    }

    /** Proiezione riga aggregata mensile (alias -> getter). */
    interface MonthlyMinutes {
        int getYr();
        int getMo();
        long getMinutes();
    }

    /** Proiezione: minuti manuali totali di un gioco (alias -> getter). */
    interface GameMinutes {
        Long getAppId();
        long getMinutes();
    }
}
