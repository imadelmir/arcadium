package com.ace5.arcadium.dto;

import java.time.LocalDateTime;

import com.ace5.arcadium.entity.Backlog;

/**
 * Voce del backlog di un utente (M4-T8): il gioco posseduto piu' lo stato di
 * avanzamento, il tempo di gioco e le date.
 *
 * <p>Riusa {@link GameSummaryResponse} (M4-T5) per la parte "gioco" — stessa card
 * del catalogo e della wishlist — e {@link BacklogStatusResponse} per lo stato con
 * etichette IT/EN. Cosi' la pagina backlog del frontend (M5-T11) ha tutto il
 * necessario in un'unica risposta.
 *
 * <p><b>Feature M6.</b> {@code manualPlaytimeMinutes} e' la somma delle ore
 * registrate a mano su QUESTO gioco (tabella {@code playtime_entry}). Serve alle
 * card di Backlog e Libreria per mostrare le ore manuali gia' al caricamento
 * (senza aprire il pannello): quando Steam non e' collegato e' questo il valore
 * "vero" del gioco, mentre {@code playtimeMinutes} resta il canale del sync Steam.
 * E' {@code null} nelle risposte a singola voce (POST/PATCH), valorizzato nelle
 * liste (dove il service lo calcola con una sola query aggregata).
 *
 * @param game                  dati sintetici del gioco posseduto
 * @param status                stato di avanzamento (codice + etichette)
 * @param playtimeMinutes       minuti giocati (nullable; da sync Steam, M4-T16)
 * @param manualPlaytimeMinutes minuti registrati a mano su questo gioco (nullable nelle risposte singole)
 * @param addedAt               quando il gioco e' stato aggiunto al backlog
 * @param startedAt             quando e' passato a "in corso" (nullable)
 * @param finishedAt            quando e' passato a "finito" (nullable)
 * @param lastPlayedAt          ultima sessione (nullable; da sync Steam)
 */
public record BacklogItemResponse(
        GameSummaryResponse game,
        BacklogStatusResponse status,
        Integer playtimeMinutes,
        Long manualPlaytimeMinutes,
        LocalDateTime addedAt,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        LocalDateTime lastPlayedAt
) {

    /**
     * Proietta una voce di {@link Backlog} senza le ore manuali (risposte a
     * singola voce: POST/PATCH). {@code manualPlaytimeMinutes} resta null.
     */
    public static BacklogItemResponse from(Backlog backlog) {
        return from(backlog, null);
    }

    /**
     * Proietta una voce di {@link Backlog} con le ore manuali totali di quel
     * gioco (usata nelle liste, dove il service le calcola in blocco).
     */
    public static BacklogItemResponse from(Backlog backlog, Long manualPlaytimeMinutes) {
        return new BacklogItemResponse(
                GameSummaryResponse.from(backlog.getGame()),
                BacklogStatusResponse.from(backlog.getStatus()),
                backlog.getPlaytimeMinutes(),
                manualPlaytimeMinutes,
                backlog.getAddedAt(),
                backlog.getStartedAt(),
                backlog.getFinishedAt(),
                backlog.getLastPlayedAt());
    }
}
