package com.ace5.arcadium.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Filtri di ricerca del catalogo, così come arrivano dalla richiesta (M4-T5).
 *
 * <p>Contiene i valori <em>grezzi</em> dei query parameter di
 * {@code GET /api/games}; tutti opzionali e combinati in AND. La conversione di
 * {@code platform}/{@code status} nelle rispettive enum (case-insensitive) e la
 * validazione (inclusa quella di {@code minPrice}/{@code maxPrice}) avvengono nel
 * {@code GameService}, che in caso di valore non valido solleva un errore 400
 * localizzato.
 *
 * @param q        sottostringa da cercare nel nome del gioco (case-insensitive)
 * @param genre    nomi di genere selezionati (change request Negozio: multi-select).
 *                 Un gioco è incluso se ha ALMENO UNO dei generi elencati (OR);
 *                 lista vuota/assente = nessun filtro. Join su game_genre → genre.name
 * @param language nomi di lingua selezionati, stessa semantica OR di {@code genre}.
 *                 Join su game_language → language.name
 * @param category nomi di categoria selezionati, stessa semantica OR di {@code genre}.
 *                 Join su game_category → category.name
 * @param platform "windows" | "mac" | "linux" (case-insensitive)
 * @param status   "free" | "paid" | "discounted" (case-insensitive)
 * @param minPrice prezzo minimo incluso (games.price &gt;= minPrice), nullable
 * @param maxPrice prezzo massimo incluso (games.price &lt;= maxPrice), nullable
 * @param europeanOnly se {@code true}, limita ai titoli che iniziano con una
 *                     lettera europea (vetrina Negozio); assente/false = tutto
 *                     il catalogo. Il Negozio lo attiva solo a ricerca vuota.
 */
public record CatalogQuery(
        String q,
        List<String> genre,
        List<String> language,
        List<String> category,
        String platform,
        String status,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Boolean europeanOnly
) {
}
