package com.ace5.arcadium.dto;

/**
 * Filtri di ricerca del catalogo, così come arrivano dalla richiesta (M4-T5).
 *
 * <p>Contiene i valori <em>grezzi</em> dei query parameter di
 * {@code GET /api/games}; tutti opzionali e combinati in AND. La conversione di
 * {@code platform}/{@code status} nelle rispettive enum (case-insensitive) e la
 * validazione avvengono nel {@code GameService}, che in caso di valore non
 * valido solleva un errore 400 localizzato.
 *
 * @param q        sottostringa da cercare nel nome del gioco (case-insensitive)
 * @param genre    nome esatto del genere (join su game_genre → genre.name)
 * @param platform "windows" | "mac" | "linux" (case-insensitive)
 * @param status   "free" | "paid" | "discounted" (case-insensitive)
 */
public record CatalogQuery(
        String q,
        String genre,
        String platform,
        String status
) {
}
