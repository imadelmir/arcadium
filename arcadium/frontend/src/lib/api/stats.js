// =============================================================================
// Statistiche personali — StatsController (M4-T10).
//   GET /api/stats/me -> UserStatsResponse {
//     gamesOwned, wishlistSize, playtimeMinutes, playtimeHours,
//     distinctGenres, completionRate,
//     byStatus:  [{ code, labelIt, labelEn, count }],
//     topGenres: [{ name, count }]
//   }
//
// Alimenta la pagina statistiche con grafici (M5-T12). L'utente è ricavato dal
// token: si vedono solo le proprie statistiche.
// =============================================================================

import api from "./client";

export function getMyStats() {
  return api.get("/api/stats/me");
}
