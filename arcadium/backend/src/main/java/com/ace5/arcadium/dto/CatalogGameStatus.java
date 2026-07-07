package com.ace5.arcadium.dto;

/**
 * "Stato" di un gioco nel catalogo statico, usato come filtro (M4-T5).
 *
 * <p>Il catalogo non ha uno stato di avanzamento (quello — mai giocato / in corso
 * / finito / abbandonato — appartiene al backlog personale, M4-T8): l'unico
 * "stato" intrinseco e utile a chi consulta il catalogo è quello <em>commerciale</em>,
 * derivato dai campi {@code price} e {@code discount} di {@code games}:
 *
 * <ul>
 *   <li>{@link #FREE} — gioco gratuito ({@code price = 0});</li>
 *   <li>{@link #PAID} — gioco a pagamento ({@code price > 0});</li>
 *   <li>{@link #DISCOUNTED} — gioco in sconto ({@code discount > 0}).</li>
 * </ul>
 *
 * <p>Il parametro arriva come stringa (es. {@code ?status=free}) ed è convertito
 * in modo case-insensitive dal {@code GameService}; un valore non riconosciuto
 * produce un 400 localizzato (IT/EN), coerente con M4-T4.
 */
public enum CatalogGameStatus {
    FREE,
    PAID,
    DISCOUNTED
}
