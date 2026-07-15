package com.ace5.arcadium.dto;

/**
 * Aggiornamento delle impostazioni dell'utente autenticato (change request
 * privacy). Campi tutti opzionali (nullable): si aggiorna solo quello presente,
 * cosi' l'endpoint puo' servire piu' impostazioni senza obbligarle tutte a ogni
 * chiamata (PATCH parziale).
 *
 * <p>Per ora l'unica impostazione e' la visibilita' del profilo
 * ({@code profilePublic}): true = profilo pubblico (cercabile e in grado di
 * cercare gli altri), false = profilo privato (non cercabile e non abilitato
 * alla ricerca). L'auto-abbandono (timeout) si aggiungera' qui una volta
 * disponibile la colonna dedicata (migrazione V9).
 *
 * @param profilePublic nuova visibilita' del profilo; se null non viene toccata
 */
public record UserSettingsRequest(
        Boolean profilePublic
) {
}
