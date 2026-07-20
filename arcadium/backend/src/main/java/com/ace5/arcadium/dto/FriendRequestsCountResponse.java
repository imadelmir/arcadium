package com.ace5.arcadium.dto;

/**
 * Numero di richieste di amicizia ricevute e ancora in attesa (change request
 * notifiche sidebar).
 *
 * <p>Perche' un record e non un {@code long} nudo: un intero restituito da solo
 * non e' JSON valido secondo la lettura stretta della specifica, e soprattutto
 * non e' estendibile. Quando arriveranno le altre notifiche (calo prezzo,
 * achievement sbloccati) bastera' aggiungere un campo qui senza rompere il
 * client, mentre passare da {@code 3} a {@code {"count":3}} sarebbe un cambio
 * incompatibile.
 *
 * @param count richieste ricevute in stato {@code pending}; 0 se nessuna
 */
public record FriendRequestsCountResponse(long count) {
}
