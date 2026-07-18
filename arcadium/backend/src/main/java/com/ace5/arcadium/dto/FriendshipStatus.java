package com.ace5.arcadium.dto;

/**
 * Stato della relazione tra l'utente autenticato e un altro utente, dal punto di
 * vista di chi guarda. Serve al client per decidere cosa mostrare: pulsante
 * "Aggiungi", "Richiesta inviata", "Accetta / Rifiuta" oppure il profilo pieno.
 */
public enum FriendshipStatus {

    /** Nessuna relazione: si puo' inviare una richiesta. */
    NONE,

    /** Richiesta inviata da me, in attesa che l'altro accetti. */
    PENDING_SENT,

    /** Richiesta ricevuta: posso accettare o rifiutare. */
    PENDING_RECEIVED,

    /** Amici: il profilo e' visibile. */
    FRIENDS,

    /** Sono io: il profilo e' sempre visibile. */
    SELF
}
