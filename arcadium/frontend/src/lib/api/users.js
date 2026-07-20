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

// Numeri delle card del profilo di un utente (giochi, in corso, ore,
// achievement sbloccati). Visibile solo tra amici: 403 altrimenti.
export function getUserProfileStats(username) {
  return api.get(`/api/users/${encodeURIComponent(username)}/stats`);
}

// Aggiorna le impostazioni dell'utente autenticato (PATCH parziale).
// `payload` = { profilePublic?, abandonAfterMonths?, avatarUrl?, safeSearch? }.
// Solo i campi presenti vengono toccati. Per RIMUOVERE l'immagine del profilo si
// passa avatarUrl: "" (stringa vuota): null significherebbe "non toccare".
// Restituisce lo UserResponse aggiornato.
export function updateMySettings(payload) {
  return api.patch("/api/users/me", payload);
}

// Cambia lo username dell'utente autenticato (V16): consentito una volta ogni
// 2 mesi. Restituisce un nuovo AuthResponse { token, user }: il chiamante DEVE
// sostituire il token salvato, perché il subject del JWT è lo username.
export function changeUsername(username) {
  return api.put("/api/users/me/username", { username });
}
