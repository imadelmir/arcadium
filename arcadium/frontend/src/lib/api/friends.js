// Client delle amicizie (change request Community).
// Il flusso e' richiesta + accettazione: finche' non siete amici, il contenuto
// del profilo dell'altro utente non e' accessibile (il backend risponde 403).

import { api } from "./client";

// I miei amici (relazioni accettate).
export function listFriends() {
  return api.get("/api/friends");
}

// Richieste ricevute e ancora in attesa: posso accettarle o rifiutarle.
export function listReceivedRequests() {
  return api.get("/api/friends/requests");
}

// Solo il NUMERO di richieste ricevute in attesa: alimenta il pallino sulla
// voce Community della sidebar, che lo richiede a intervalli regolari.
// Restituisce { count }.
export function countReceivedRequests() {
  return api.get("/api/friends/requests/count");
}

// Richieste che ho inviato e che attendono risposta.
export function listSentRequests() {
  return api.get("/api/friends/requests/sent");
}

// Invia una richiesta di amicizia.
export function sendFriendRequest(username) {
  return api.post(`/api/friends/${encodeURIComponent(username)}`);
}

// Accetta una richiesta ricevuta da questo utente.
export function acceptFriendRequest(username) {
  return api.post(`/api/friends/${encodeURIComponent(username)}/accept`);
}

// Cancella la relazione: rifiuta una richiesta ricevuta, annulla una inviata
// oppure rimuove un amico. Il backend risponde 204.
export function removeFriend(username) {
  return api.delete(`/api/friends/${encodeURIComponent(username)}`);
}
