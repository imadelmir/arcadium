// =============================================================================
// Achievement interni — AchievementController (M4-T11).
//   GET  /api/achievements          -> AchievementResponse[]  (badge con avanzamento e sblocco)
//   POST /api/achievements/evaluate -> AchievementResponse[]  (valuta e sblocca i nuovi badge)
//
// AchievementResponse: {
//   code, nameIt, nameEn, descriptionIt, descriptionEn, iconUrl,
//   metric, threshold, points, progress, unlocked, unlockedAt
// }
// =============================================================================

import api from "./client";

// Elenco dei badge attivi con avanzamento e stato di sblocco.
export function listAchievements() {
  return api.get("/api/achievements");
}

// Rivaluta i badge: restituisce quelli appena sbloccati.
export function evaluateAchievements() {
  return api.post("/api/achievements/evaluate");
}
