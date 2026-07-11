// =============================================================================
// Backlog personale (giochi posseduti con stato) — BacklogController (M4-T8).
//   GET    /api/backlog            -> BacklogItemResponse[]     (opz. ?status=)
//   GET    /api/backlog/statuses   -> BacklogStatusResponse[]   { code, labelIt, labelEn }
//   POST   /api/backlog/{appId}    -> BacklogItemResponse        (201; stato iniziale "mai_giocato")
//   PATCH  /api/backlog/{appId}    -> BacklogItemResponse        (cambia stato e/o tempo di gioco)
//   DELETE /api/backlog/{appId}    -> 204 No Content
//
// L'utente NON è un parametro: il backend lo ricava dal token. Ognuno agisce
// solo sul proprio backlog. Gli stati validi sono i quattro del DB:
//   mai_giocato · in_corso · finito · abbandonato   (vedi lib/constants.js).
// =============================================================================

import api from "./client";

// Elenco del proprio backlog. Con `status` filtra per un singolo stato.
export function listBacklog(status) {
  return api.get("/api/backlog", { status });
}

// Stati possibili (con etichette IT/EN), già ordinati per la UI.
export function listBacklogStatuses() {
  return api.get("/api/backlog/statuses");
}

// Aggiunge un gioco posseduto (stato iniziale "mai_giocato").
export function addToBacklog(appId) {
  return api.post(`/api/backlog/${appId}`);
}

// Aggiorna una voce: nuovo stato e/o tempo di gioco (minuti). Entrambi opzionali.
export function updateBacklog(appId, { status, playtimeMinutes } = {}) {
  return api.patch(`/api/backlog/${appId}`, { status, playtimeMinutes });
}

// Rimuove un gioco dal backlog.
export function removeFromBacklog(appId) {
  return api.delete(`/api/backlog/${appId}`);
}
