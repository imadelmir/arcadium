// =============================================================================
// Catalogo giochi — rispecchia GameController del backend (M4-T5, M4-T6).
//   GET /api/games          -> PageResponse<GameSummaryResponse>  (lista + filtri + paginazione)
//   GET /api/games/{appId}  -> GameDetailResponse                  (dettaglio completo)
//
// Filtri della lista (tutti opzionali, in AND):
//   q                    sottostringa nel nome (case-insensitive)
//   genre/language/category  array di nomi selezionati (change request Negozio:
//                        multi-select). Un gioco entra se ha ALMENO UNO dei
//                        valori scelti per ciascun filtro (OR dentro il filtro,
//                        AND fra filtri). Inviati come CSV: ["Action","Indie"] -> "Action,Indie".
//   platform             "windows" | "mac" | "linux"
//   status               "free" | "paid" | "discounted"
// NON esiste un parametro `safeSearch`: il filtro contenuti per adulti (V18) e'
// applicato dal backend leggendo la preferenza dell'utente autenticato, proprio
// perche' un query param sarebbe aggirabile dal client. Il frontend lo rispecchia
// soltanto (indicatore nel Negozio, interruttore in Impostazioni).
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
export function listGames({ q, genre, language, category, platform, status, minPrice, maxPrice, europeanOnly, page, size, sort } = {}) {
  return api.get("/api/games", { q, genre, language, category, platform, status, minPrice, maxPrice, europeanOnly, page, size, sort });
}

/**
 * Valori per i menu a tendina dei filtri del Negozio (generi, categorie, lingue).
 * Da chiamare una volta al montaggio della pagina.
 * @returns { genres: string[], categories: string[], languages: string[] }
 */
export function getGameFilters() {
  return api.get("/api/games/filters");
}

/**
 * Dettaglio di un gioco per la sua chiave naturale appId.
 * @returns GameDetailResponse (404 se l'appId non esiste)
 */
export function getGame(appId) {
  return api.get(`/api/games/${appId}`);
}
