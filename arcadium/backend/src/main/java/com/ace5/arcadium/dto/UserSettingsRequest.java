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
 *   <li>{@code avatarUrl} — foto profilo (change request avatar): un percorso
 *       tra i 6 preset serviti da {@code /avatars/*.svg} (frontend, cartella
 *       pubblica). Non e' un upload libero: il servizio valida che il valore
 *       sia uno dei preset noti, altrimenti 400.
 *       <p><b>Stringa VUOTA = rimozione</b> (change request avatar predefinito):
 *       l'utente torna all'avatar generato dall'iniziale dello username. Serve un
 *       sentinella distinto perche' {@code null} significa gia' "non toccare il
 *       campo" nella semantica PATCH di questo record, e JSON non permette di
 *       distinguere "assente" da "esplicitamente null".</li>
 *   <li>{@code safeSearch} — filtro contenuti per adulti nel Negozio (V18):
 *       true = i titoli con generi/tag espliciti o {@code required_age >= 18}
 *       non vengono mostrati; false = catalogo completo.</li>
 * </ul>
 *
 * @param profilePublic      nuova visibilita' del profilo; se null non viene toccata
 * @param abandonAfterMonths nuovo timeout auto-abbandono (0/1/3/6); se null non viene toccato
 * @param avatarUrl          nuovo percorso avatar tra i preset, "" per rimuoverlo; se null non viene toccato
 * @param safeSearch         nuovo stato del safe search; se null non viene toccato
 */
public record UserSettingsRequest(
        Boolean profilePublic,
        Integer abandonAfterMonths,
        String avatarUrl,
        Boolean safeSearch
) {
}
