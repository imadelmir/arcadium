package com.ace5.arcadium.dto;

import java.util.List;

/**
 * Statistiche personali dell'utente autenticato (M4-T10).
 *
 * <p>Vista aggregata della libreria di un utente: quanti giochi possiede, come
 * sono ripartiti per stato di avanzamento, quante ore ha giocato, quanti giochi
 * ha in wishlist, quanti generi distinti copre e i suoi generi piu' frequenti.
 * Alimenta la pagina statistiche del frontend con i grafici Recharts (M5-T12) e
 * anticipa le metriche su cui poggera' il motore achievement (M4-T11): le stesse
 * grandezze — {@code games_owned}, {@code games_finished}, {@code playtime_hours},
 * {@code wishlist_size}, {@code distinct_genres} — definite in M1-T7 §5.
 *
 * <p>A differenza degli altri DTO del backend non c'e' una proiezione
 * {@code from(entita')}: l'oggetto e' composto dal {@code StatsService} a partire
 * da piu' query aggregate (conteggio per stato, somma del tempo di gioco, generi
 * distinti e top generi), non da una singola riga.
 *
 * <p>La ripartizione {@link #byStatus()} contiene SEMPRE tutti gli stati previsti
 * dal seed (anche quelli a zero), nell'ordine di {@code sort_order}: cosi' il
 * grafico a torta/barre del frontend ha un insieme di sezioni stabile.
 *
 * <p><b>Ore per mese (feature M6).</b> {@link #monthly()} contiene SEMPRE 12 voci
 * (ultimi 12 mesi, dalla piu' vecchia alla piu' recente, anche a zero), cosi' il
 * grafico ad area ha un asse stabile. E' calcolata dal registro manuale
 * ({@code playtime_entry}), non da Steam: Steam fornisce solo il totale, non lo
 * storico per mese.
 *
 * <p><b>Totale ore e Steam ("Steam vince").</b> {@link #playtimeMinutes()} /
 * {@link #playtimeHours()} provengono dal sync Steam ({@code backlog.playtime_minutes})
 * quando l'utente ha un account Steam collegato; altrimenti dalla somma delle voci
 * manuali. La serie {@link #monthly()} resta comunque quella manuale.
 *
 * @param gamesOwned      totale giochi posseduti (somma delle sezioni per stato)
 * @param wishlistSize    numero di giochi in wishlist
 * @param playtimeMinutes minuti di gioco totali (Steam se collegato, altrimenti somma voci manuali)
 * @param playtimeHours   ore di gioco totali (minuti / 60, troncate)
 * @param distinctGenres  numero di generi distinti fra i giochi posseduti
 * @param completionRate  quota di giochi finiti sul posseduto, in [0,1] (0 se non possiede giochi)
 * @param byStatus        ripartizione per stato, tutti gli stati in ordine (con etichette IT/EN)
 * @param topGenres       generi piu' frequenti nel posseduto, dal piu' numeroso
 * @param monthly         ore per mese, ultimi 12 mesi in ordine cronologico (dal registro manuale)
 */
public record UserStatsResponse(
        long gamesOwned,
        long wishlistSize,
        long playtimeMinutes,
        long playtimeHours,
        long distinctGenres,
        double completionRate,
        List<StatusBreakdown> byStatus,
        List<TopGenre> topGenres,
        List<MonthlyPlaytime> monthly
) {

    /**
     * Una sezione della ripartizione per stato: lo stato (codice + etichette
     * bilingue, come {@link BacklogStatusResponse}) e quanti giochi posseduti vi
     * ricadono. Record annidato per tenere in un solo file il contratto delle
     * statistiche.
     *
     * @param code    codice stabile dello stato ('mai_giocato', 'in_corso', ...)
     * @param labelIt etichetta italiana
     * @param labelEn etichetta inglese
     * @param count   numero di giochi posseduti in quello stato
     */
    public record StatusBreakdown(String code, String labelIt, String labelEn, long count) {
    }

    /**
     * Un genere e quanti giochi posseduti vi appartengono (per il grafico dei
     * generi, M5-T12).
     *
     * @param name  nome del genere
     * @param count numero di giochi posseduti di quel genere
     */
    public record TopGenre(String name, long count) {
    }

    /**
     * Tempo giocato in un mese (feature "registro ore", M6). Anno e mese
     * espliciti (1-12) cosi' il frontend costruisce l'etichetta nella lingua
     * corrente senza dipendere dalla posizione nell'array.
     *
     * @param year    anno del mese
     * @param month   mese (1 = gennaio ... 12 = dicembre)
     * @param minutes minuti totali dichiarati in quel mese
     * @param hours   ore totali (minuti / 60, troncate)
     */
    public record MonthlyPlaytime(int year, int month, long minutes, long hours) {
    }
}
