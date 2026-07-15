package com.ace5.arcadium.dto;

import java.util.List;

/**
 * Valori disponibili per i menu a tendina dei filtri del Negozio (change
 * request Negozio): generi, categorie e lingue presenti nel catalogo.
 *
 * <p>Ogni lista contiene i NOMI distinti ordinati per popolarità (numero di
 * giochi) e poi alfabeticamente. Alimenta le tendine "Genere", "Categoria" e
 * "Lingua" del frontend, che li invia poi come filtri a {@code GET /api/games}.
 *
 * @param genres     nomi dei generi (es. Action, RPG, Indie, ...)
 * @param categories nomi delle categorie Steam (es. Single-player, Co-op, ...)
 * @param languages  nomi delle lingue supportate (es. English, Italian, ...)
 */
public record CatalogFiltersResponse(
        List<String> genres,
        List<String> categories,
        List<String> languages
) {
}
