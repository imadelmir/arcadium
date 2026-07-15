// =============================================================================
// Ricerca utenti e librerie altrui — UserController (M4-T9).
//   GET /api/users?q=                 -> PageResponse<UserSummaryResponse>
//   GET /api/users/{username}         -> UserSummaryResponse { username, displayName, avatarUrl, profilePublic, createdAt }
//   GET /api/users/{username}/backlog -> BacklogItemResponse[]  (403 se profilo privato altrui)
//   GET /api/users/{username}/wishlist-> WishlistItemResponse[] (403 se profilo privato altrui)
//
// Alimenta la pagina Community. Vengono esposti solo dati pubblici (mai l'email).
// =============================================================================

import api from "./client";

// Ricerca utenti (paginata). Con q vuoto elenca tutti gli utenti.
export function searchUsers({ q, page, size } = {}) {
  return api.get("/api/users", { q, page, size });
}

// Profilo pubblico di un utente.
export function getUserProfile(username) {
  return api.get(`/api/users/${username}`);
}

// Backlog di un utente (se visibile).
export function getUserBacklog(username) {
  return api.get(`/api/users/${username}/backlog`);
}

// Wishlist di un utente (se visibile).
export function getUserWishlist(username) {
  return api.get(`/api/users/${username}/wishlist`);
}

// Aggiorna le impostazioni dell'utente autenticato (change request privacy).
// `payload` = { profilePublic? }. Restituisce lo UserResponse aggiornato.
export function updateMySettings(payload) {
  return api.patch("/api/users/me", payload);
}
