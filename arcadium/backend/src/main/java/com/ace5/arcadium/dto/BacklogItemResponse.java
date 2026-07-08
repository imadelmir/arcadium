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
 * <p>La proiezione {@link #from(Backlog)} legge le relazioni LAZY al gioco e allo
 * stato: va invocata dentro la transazione del service, oppure su una voce i cui
 * gioco e stato sono gia' stati caricati via fetch join (come fa la lettura in
 * elenco).
 *
 * @param game            dati sintetici del gioco posseduto
 * @param status          stato di avanzamento (codice + etichette)
 * @param playtimeMinutes minuti giocati (nullable; da sync Steam, M4-T16)
 * @param addedAt         quando il gioco e' stato aggiunto al backlog
 * @param startedAt       quando e' passato a "in corso" (nullable)
 * @param finishedAt      quando e' passato a "finito" (nullable)
 * @param lastPlayedAt    ultima sessione (nullable; da sync Steam)
 */
public record BacklogItemResponse(
        GameSummaryResponse game,
        BacklogStatusResponse status,
        Integer playtimeMinutes,
        LocalDateTime addedAt,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        LocalDateTime lastPlayedAt
) {

    /** Proietta una voce di {@link Backlog} nel DTO di risposta. */
    public static BacklogItemResponse from(Backlog backlog) {
        return new BacklogItemResponse(
                GameSummaryResponse.from(backlog.getGame()),
                BacklogStatusResponse.from(backlog.getStatus()),
                backlog.getPlaytimeMinutes(),
                backlog.getAddedAt(),
                backlog.getStartedAt(),
                backlog.getFinishedAt(),
                backlog.getLastPlayedAt());
    }
}
