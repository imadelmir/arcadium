// =============================================================================
// Registro ore giocate (manuale, datato) — PlaytimeController (M6).
//   GET    /api/backlog/{appId}/playtime  -> PlaytimeEntryResponse[]  (della sessione piu' recente)
//   POST   /api/backlog/{appId}/playtime  -> PlaytimeEntryResponse     (201; { minutes, playedOn })
//   DELETE /api/playtime/{entryId}        -> 204 No Content
//
// L'utente NON e' un parametro: il backend lo ricava dal token. Si registrano
// ore solo per un gioco gia' nel proprio backlog (altrimenti 404). Quando Steam
// e' collegato il totale ore passa a Steam: la UI disabilita l'inserimento.
// =============================================================================

import api from "./client";

// Voci registrate per un gioco (dalla piu' recente).
export function listPlaytime(appId) {
  return api.get(`/api/backlog/${appId}/playtime`);
}

// Aggiunge una sessione: minuti (> 0) e giorno (YYYY-MM-DD, non futuro).
export function addPlaytime(appId, { minutes, playedOn }) {
  return api.post(`/api/backlog/${appId}/playtime`, { minutes, playedOn });
}

// Elimina una propria voce.
export function deletePlaytime(entryId) {
  return api.delete(`/api/playtime/${entryId}`);
}
