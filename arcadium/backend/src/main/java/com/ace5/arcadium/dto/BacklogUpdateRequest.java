package com.ace5.arcadium.dto;

import jakarta.validation.constraints.Min;

/**
 * Corpo del PATCH /api/backlog/{appId} (M4-T8): aggiornamento parziale di una
 * voce del backlog.
 *
 * <p>Entrambi i campi sono opzionali e indipendenti:
 * <ul>
 *   <li>{@code status} — codice del nuovo stato ('mai_giocato', 'in_corso',
 *       'finito', 'abbandonato'); validato contro la lookup nel service, con 400
 *       localizzato se non riconosciuto;</li>
 *   <li>{@code playtimeMinutes} — minuti giocati; {@code @Min(0)} rifiuta i
 *       valori negativi con un 400 localizzato (rispetta il vincolo di dominio
 *       playtime_minutes &gt;= 0).</li>
 * </ul>
 *
 * <p>Se entrambi sono assenti, il PATCH e' un no-op e restituisce la voce
 * invariata. La validazione @Min scatta solo quando il campo e' presente (null
 * e' considerato valido), coerente con la natura parziale di PATCH.
 *
 * @param status          nuovo codice di stato (opzionale)
 * @param playtimeMinutes minuti giocati, &gt;= 0 (opzionale)
 */
public record BacklogUpdateRequest(
        String status,
        @Min(0) Integer playtimeMinutes
) {
}
