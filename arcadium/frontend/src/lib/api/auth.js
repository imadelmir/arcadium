// =============================================================================
// Chiamate di autenticazione — rispecchiano AuthController del backend (M4-T3).
//   POST /api/auth/register  (pubblico) -> AuthResponse { token, tokenType, expiresIn, user }
//   POST /api/auth/login     (pubblico) -> AuthResponse
//   GET  /api/auth/me        (protetto) -> UserResponse { id, username, email, displayName, preferredLanguage, profilePublic }
//
// Recupero password (M4-T17):
//   POST /api/auth/forgot-password (pubblico) -> { message, devToken? }
//   POST /api/auth/reset-password  (pubblico) -> { message }
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

// -----------------------------------------------------------------------------
// Recupero password (M4-T17) — entrambi gli endpoint sono pubblici (auth:false).
// -----------------------------------------------------------------------------

// Passo 1: richiesta di reset. Risponde sempre con lo stesso messaggio generico
// (esista o no l'email). In dev, se il backend ha expose-token=true, la risposta
// include anche `devToken` per provare il flusso senza email.
export function forgotPassword(email) {
  return api.post("/api/auth/forgot-password", { email }, { auth: false });
}

// Passo 2: reimpostazione. `token` arriva dal link, `newPassword` è la nuova
// password scelta dall'utente. Token non valido/scaduto/già usato -> 400.
export function resetPassword(token, newPassword) {
  return api.post("/api/auth/reset-password", { token, newPassword }, { auth: false });
}
