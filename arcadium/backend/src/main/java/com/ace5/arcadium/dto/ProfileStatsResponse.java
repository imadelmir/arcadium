package com.ace5.arcadium.dto;

/**
 * Numeri mostrati nelle card del profilo (change request Community): pochi dati
 * aggregati, senza esporre la libreria vera e propria.
 *
 * <p>Sostituisce, per la pagina profilo, l'uso di {@code /api/stats/me}: cosi'
 * le stesse card valgono sia sul proprio profilo sia su quello di un amico. Il
 * conteggio dei generi non c'e' piu' (richiesta del cliente), al suo posto il
 * totale degli achievement sbloccati.
 *
 * <p>Le ore sono quelle gia' calcolate dalle statistiche ({@code minuti / 60}):
 * si espongono cosi' com'e' la pagina Statistiche, per non mostrare allo stesso
 * utente due totali diversi a seconda di dove li guarda.
 *
 * @param gamesOwned           giochi posseduti (voci nel backlog)
 * @param playing              giochi attualmente "in corso"
 * @param playtimeMinutes      minuti giocati totali
 * @param playtimeHours        ore giocate totali (stesso valore della pagina Statistiche)
 * @param achievementsUnlocked achievement sbloccati
 */
public record ProfileStatsResponse(
        long gamesOwned,
        long playing,
        long playtimeMinutes,
        long playtimeHours,
        long achievementsUnlocked
) {
}
