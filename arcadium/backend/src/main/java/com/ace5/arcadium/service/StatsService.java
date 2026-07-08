package com.ace5.arcadium.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.UserStatsResponse;
import com.ace5.arcadium.repository.BacklogRepository;
import com.ace5.arcadium.repository.BacklogStatusRepository;
import com.ace5.arcadium.repository.WishlistRepository;

/**
 * Statistiche personali dell'utente autenticato (M4-T10).
 *
 * <p>Come backlog e wishlist (M4-T7/T8), tutto e' "scoped" all'utente ricevuto
 * dal controller (ricavato dal token, mai da un parametro): un utente vede solo
 * le proprie statistiche. Non ci sono esiti d'errore da localizzare — si legge
 * la libreria di chi chiama, che al piu' e' vuota — quindi nessuna nuova chiave
 * in {@code messages*.properties}.
 *
 * <p>Le grandezze sono calcolate con query <em>aggregate</em> nel database
 * (conteggio per stato, somma del tempo di gioco, generi distinti, top generi),
 * non caricando l'intero backlog in memoria: coerente con la scelta anti-N+1 del
 * catalogo e del backlog (M4-T5/T8), e adatto a librerie di qualunque dimensione.
 *
 * <p>La ripartizione per stato viene fusa con l'elenco completo degli stati
 * (dalla lookup {@code backlog_status}) cosi' che TUTTI gli stati compaiano —
 * anche quelli a zero — nell'ordine di {@code sort_order}, dando al frontend
 * (M5-T12) un insieme di sezioni stabile per il grafico.
 */
@Service
public class StatsService {

    /** Codice dello stato "finito": serve al calcolo del tasso di completamento. */
    private static final String STATUS_FINISHED = "finito";

    /** Quanti generi mostrare nel grafico dei generi piu' frequenti. */
    private static final int TOP_GENRES_LIMIT = 10;

    /** Minuti in un'ora, per la conversione del tempo di gioco. */
    private static final long MINUTES_PER_HOUR = 60L;

    /** Fattore di arrotondamento del tasso di completamento (4 decimali). */
    private static final double RATE_SCALE = 10_000d;

    private final BacklogRepository backlogRepository;
    private final WishlistRepository wishlistRepository;
    private final BacklogStatusRepository statusRepository;

    public StatsService(BacklogRepository backlogRepository,
                        WishlistRepository wishlistRepository,
                        BacklogStatusRepository statusRepository) {
        this.backlogRepository = backlogRepository;
        this.wishlistRepository = wishlistRepository;
        this.statusRepository = statusRepository;
    }

    /**
     * Calcola le statistiche personali dell'utente autenticato.
     *
     * @param userId id dell'utente autenticato (dal token)
     * @return statistiche aggregate della sua libreria
     */
    @Transactional(readOnly = true)
    public UserStatsResponse getStats(Long userId) {
        // Ripartizione per stato: mappa codice -> conteggio (solo gli stati presenti).
        Map<String, Long> countByStatus = new HashMap<>();
        for (BacklogRepository.StatusCount row : backlogRepository.countByStatus(userId)) {
            countByStatus.put(row.getCode(), row.getCount());
        }

        long gamesOwned = countByStatus.values().stream().mapToLong(Long::longValue).sum();
        long finished = countByStatus.getOrDefault(STATUS_FINISHED, 0L);

        // Fusione con l'elenco completo degli stati: tutti presenti, in ordine,
        // con le etichette IT/EN e conteggio 0 dove l'utente non ha giochi.
        List<UserStatsResponse.StatusBreakdown> byStatus =
                statusRepository.findAllByOrderBySortOrderAsc().stream()
                        .map(status -> new UserStatsResponse.StatusBreakdown(
                                status.getCode(),
                                status.getLabelIt(),
                                status.getLabelEn(),
                                countByStatus.getOrDefault(status.getCode(), 0L)))
                        .toList();

        long playtimeMinutes = backlogRepository.sumPlaytimeMinutes(userId);
        long wishlistSize = wishlistRepository.countByUser(userId);
        long distinctGenres = backlogRepository.countDistinctGenres(userId);

        List<UserStatsResponse.TopGenre> topGenres =
                backlogRepository.topGenres(userId, PageRequest.of(0, TOP_GENRES_LIMIT)).stream()
                        .map(genre -> new UserStatsResponse.TopGenre(genre.getName(), genre.getCount()))
                        .toList();

        double completionRate = completionRate(finished, gamesOwned);

        return new UserStatsResponse(
                gamesOwned,
                wishlistSize,
                playtimeMinutes,
                playtimeMinutes / MINUTES_PER_HOUR,
                distinctGenres,
                completionRate,
                byStatus,
                topGenres);
    }

    /**
     * Quota di giochi finiti sul posseduto, in [0,1], arrotondata a 4 decimali.
     * Zero (senza divisione) se l'utente non possiede giochi.
     */
    private double completionRate(long finished, long owned) {
        if (owned == 0) {
            return 0.0;
        }
        return Math.round((double) finished / owned * RATE_SCALE) / RATE_SCALE;
    }
}
