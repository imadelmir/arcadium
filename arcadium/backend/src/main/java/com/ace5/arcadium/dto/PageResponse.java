package com.ace5.arcadium.dto;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * Involucro di paginazione stabile per le risposte REST (M4-T5).
 *
 * <p>Si preferisce a serializzare direttamente {@link Page}/{@code PageImpl}:
 * la loro struttura JSON è considerata instabile (Spring Boot lo segnala) e
 * legherebbe il contratto dell'API ai dettagli interni di Spring Data. Qui il
 * contratto è esplicito e controllato da noi.
 *
 * @param <T>           tipo degli elementi della pagina
 * @param content       elementi della pagina corrente
 * @param page          indice della pagina (0-based)
 * @param size          dimensione richiesta della pagina
 * @param totalElements totale elementi che soddisfano i filtri
 * @param totalPages    numero totale di pagine
 * @param first         true se è la prima pagina
 * @param last          true se è l'ultima pagina
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {

    /**
     * Costruisce l'involucro dai metadati di una {@link Page} già eseguita e dal
     * contenuto già proiettato nel DTO di risposta.
     */
    public static <T> PageResponse<T> of(Page<?> page, List<T> content) {
        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast());
    }
}
