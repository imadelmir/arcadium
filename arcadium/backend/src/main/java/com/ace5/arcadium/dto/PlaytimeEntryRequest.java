package com.ace5.arcadium.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;

/**
 * Corpo del POST /api/backlog/{appId}/playtime (feature "registro ore", M6):
 * una sessione di gioco dichiarata a mano dall'utente.
 *
 * <p>Il gioco ({@code appId}) arriva dal path, non dal corpo: qui restano solo
 * la durata e il giorno.
 * <ul>
 *   <li>{@code minutes} — durata in minuti; {@code @Positive} impone &gt; 0,
 *       coerente col vincolo di dominio {@code chk_playtime_entry_minutes};</li>
 *   <li>{@code playedOn} — giorno della sessione; {@code @PastOrPresent} vieta
 *       date future (non si dichiara tempo giocato nel futuro).</li>
 * </ul>
 * Entrambi obbligatori: una voce senza durata o senza data non ha senso.
 *
 * @param minutes  minuti giocati, &gt; 0
 * @param playedOn giorno a cui attribuire la sessione (determina il mese nel grafico)
 */
public record PlaytimeEntryRequest(
        @NotNull @Positive Integer minutes,
        @NotNull @PastOrPresent LocalDate playedOn
) {
}
