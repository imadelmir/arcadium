package com.ace5.arcadium.dto;

import java.time.LocalDateTime;

import com.ace5.arcadium.entity.Wishlist;

/**
 * Voce della wishlist di un utente (M4-T7): il gioco in forma sintetica piu' la
 * data in cui e' stato aggiunto.
 *
 * <p>Riusa {@link GameSummaryResponse} (M4-T5) per la parte "gioco": stessa card
 * del catalogo, nessuna duplicazione di campi. Cosi' la wishlist del frontend
 * (M5-T10) mostra gli stessi dati della lista catalogo, piu' l'istante di aggiunta.
 *
 * <p>La proiezione {@link #from(Wishlist)} legge la relazione LAZY al gioco:
 * va invocata dentro la transazione del service, oppure su una wishlist il cui
 * gioco e' gia' stato caricato via fetch join (come fa la lettura in elenco).
 *
 * @param game    dati sintetici del gioco desiderato
 * @param addedAt istante in cui il gioco e' stato aggiunto alla wishlist
 */
public record WishlistItemResponse(
        GameSummaryResponse game,
        LocalDateTime addedAt
) {

    /** Proietta una voce di {@link Wishlist} nel DTO di risposta. */
    public static WishlistItemResponse from(Wishlist wishlist) {
        return new WishlistItemResponse(
                GameSummaryResponse.from(wishlist.getGame()),
                wishlist.getAddedAt());
    }
}