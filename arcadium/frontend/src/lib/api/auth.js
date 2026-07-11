// =============================================================================
// Chiamate di autenticazione — rispecchiano AuthController del backend (M4-T3).
//   POST /api/auth/register  (pubblico) -> AuthResponse { token, tokenType, expiresIn, user }
//   POST /api/auth/login     (pubblico) -> AuthResponse
//   GET  /api/auth/me        (protetto) -> UserResponse { id, username, email, displayName, preferredLanguage, profilePublic }
//
// ATTENZIONE: il login del backend usa lo USERNAME (non l'email) + password
// (vedi DTO LoginRequest). La registrazione richiede username, email, password
// (min 8 caratteri) e, opzionali, displayName e preferredLanguage ("it"|"en").
// =============================================================================

import api from "./client";

// Login con username + password. auth:false perché l'endpoint è pubblico.
export function login(username, password) {
  return api.post("/api/auth/login", { username, password }, { auth: false });
}

// Registrazione. `payload` = { username, email, password, displayName?, preferredLanguage? }.
export function register(payload) {
  return api.post("/api/auth/register", payload, { auth: false });
}

// Utente attualmente autenticato (ricavato dal token). Usato per re-idratare la
// sessione al ricaricamento della pagina.
export function me() {
  return api.get("/api/auth/me");
}
