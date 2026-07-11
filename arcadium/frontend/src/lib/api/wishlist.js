// =============================================================================
// Wishlist personale — WishlistController (M4-T7).
//   GET    /api/wishlist          -> WishlistItemResponse[]  { game, addedAt }
//   POST   /api/wishlist/{appId}  -> WishlistItemResponse     (201; 409 se già presente)
//   DELETE /api/wishlist/{appId}  -> 204 No Content
//
// Come per il backlog, l'utente si ricava dal token: ognuno agisce solo sulla
// propria wishlist.
// =============================================================================

import api from "./client";

// Elenco della propria wishlist.
export function listWishlist() {
  return api.get("/api/wishlist");
}

// Aggiunge un gioco alla wishlist.
export function addToWishlist(appId) {
  return api.post(`/api/wishlist/${appId}`);
}

// Rimuove un gioco dalla wishlist.
export function removeFromWishlist(appId) {
  return api.delete(`/api/wishlist/${appId}`);
}
