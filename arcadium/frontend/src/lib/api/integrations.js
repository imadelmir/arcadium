// =============================================================================
// Integrazione Steam — SteamController (M5-T15).
//   GET    /api/integrations/steam/login-url  -> { url }   URL di login OpenID
//   POST   /api/integrations/steam/connect    -> collega l'account (salva steamId)
//   POST   /api/integrations/steam/sync        -> importa libreria + ore di gioco
//   DELETE /api/integrations/steam             -> scollega l'account (204)
//
// Come gli altri moduli, l'utente si ricava dal token: ognuno agisce solo
// sul proprio account.
// =============================================================================

import api from "./client";

// Chiede al backend l'URL di login Steam (OpenID) verso cui reindirizzare.
export function getSteamLoginUrl() {
  return api.get("/api/integrations/steam/login-url");
}

// Finalizza il collegamento: invia i parametri OpenID di ritorno da Steam.
// `params` sono i valori openid.* letti dall'URL al rientro sulla pagina.
export function connectSteam(params) {
  return api.post("/api/integrations/steam/connect", params);
}

// Sincronizza libreria e ore di gioco dall'account Steam collegato.
export function syncSteam() {
  return api.post("/api/integrations/steam/sync");
}

// Scollega l'account Steam (azzera lo steamId).
export function disconnectSteam() {
  return api.delete("/api/integrations/steam");
}