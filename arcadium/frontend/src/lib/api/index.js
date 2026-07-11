// =============================================================================
// Punto di import unico per le chiamate al backend.
// Permette alle pagine di scrivere, per esempio:
//   import { listGames, addToWishlist } from "@/lib/api";
// invece di raggiungere ogni singolo file.
// =============================================================================

export { default as api, ApiError, getToken, setToken, clearToken } from "./client";
export * from "./auth";
export * from "./games";
export * from "./backlog";
export * from "./wishlist";
export * from "./stats";
export * from "./achievements";
export * from "./users";
