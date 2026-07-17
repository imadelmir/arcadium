package com.ace5.arcadium.dto;

/**
 * Aggiornamento delle impostazioni dell'utente autenticato (PATCH parziale).
 * Campi tutti opzionali (nullable): si aggiorna SOLO quello presente, cosi'
 * l'endpoint serve piu' impostazioni senza obbligarle tutte a ogni chiamata.
 *
 * <ul>
 *   <li>{@code profilePublic} — visibilita' del profilo (change request privacy):
 *       true = pubblico, false = privato. Il cambio reale e' soggetto a cooldown 48h.</li>
 *   <li>{@code abandonAfterMonths} — timeout di auto-abbandono (change request,
 *       feature M6): <b>0 = disattivato</b>, 1/3/6 = mesi di inattivita' oltre i
 *       quali un gioco "In corso" passa ad "Abbandonato". A DB 0 diventa NULL
 *       (colonna V9, dominio {NULL,1,3,6}).</li>
 * </ul>
 *
 * @param profilePublic      nuova visibilita' del profilo; se null non viene toccata
 * @param abandonAfterMonths nuovo timeout auto-abbandono (0/1/3/6); se null non viene toccato
 */
public record UserSettingsRequest(
        Boolean profilePublic,
        Integer abandonAfterMonths
) {
}
