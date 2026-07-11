// =============================================================================
// Catalogo giochi — rispecchia GameController del backend (M4-T5, M4-T6).
//   GET /api/games          -> PageResponse<GameSummaryResponse>  (lista + filtri + paginazione)
//   GET /api/games/{appId}  -> GameDetailResponse                  (dettaglio completo)
//
// Filtri della lista (tutti opzionali, in AND):
//   q        sottostringa nel nome (case-insensitive)
//   genre    nome del genere
//   platform "windows" | "mac" | "linux"
//   status   "free" | "paid" | "discounted"
// Paginazione/ordinamento standard Spring Data:
//   page (0-based), size, sort (es. "price,desc"). Default backend: 20, per nome.
// =============================================================================

import api from "./client";

/**
 * Lista paginata del catalogo.
 * @param {object} opts { q, genre, platform, status, page, size, sort }
 *   - sort può essere stringa "price,desc" oppure array ["price","desc"].
 * @returns PageResponse<GameSummaryResponse>
 */
export function listGames({ q, genre, platform, status, page, size, sort } = {}) {
  return api.get("/api/games", { q, genre, platform, status, page, size, sort });
}

/**
 * Dettaglio di un gioco per la sua chiave naturale appId.
 * @returns GameDetailResponse (404 se l'appId non esiste)
 */
export function getGame(appId) {
  return api.get(`/api/games/${appId}`);
}
