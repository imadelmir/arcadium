package com.ace5.arcadium.dto;

import com.ace5.arcadium.entity.BacklogStatus;

/**
 * Uno stato possibile del backlog, in forma di risposta (M4-T8).
 *
 * <p>Espone il {@code code} stabile (usato dal client per cambiare stato) e le
 * etichette bilingue IT/EN, cosi' il frontend (M5-T11) mostra il nome nella
 * lingua corrente senza una chiamata aggiuntiva. L'id numerico della lookup
 * resta interno al DB e non compare nell'API.
 *
 * @param code    codice stabile dello stato ('mai_giocato', 'in_corso', ...)
 * @param labelIt etichetta italiana
 * @param labelEn etichetta inglese
 */
public record BacklogStatusResponse(
        String code,
        String labelIt,
        String labelEn
) {

    /** Proietta la lookup {@link BacklogStatus} nel DTO di risposta. */
    public static BacklogStatusResponse from(BacklogStatus status) {
        return new BacklogStatusResponse(
                status.getCode(),
                status.getLabelIt(),
                status.getLabelEn());
    }
}
