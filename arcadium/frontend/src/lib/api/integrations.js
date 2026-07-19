// =============================================================================
// Integrazione Steam — SteamController.
//   POST   /api/integrations/steam/connect -> collega l'account (profilo + chiave API)
//   POST   /api/integrations/steam/sync    -> importa libreria + ore di gioco
//   DELETE /api/integrations/steam         -> scollega l'account (204)
//
// Come gli altri moduli, l'utente si ricava dal token: ognuno agisce solo
// sul proprio account.
//
// Non esiste piu' getSteamLoginUrl(): il login OpenID di Steam identificava
// l'utente ma non rilasciava alcuna credenziale per leggerne la libreria, quindi
// non poteva portare a termine il collegamento. Al suo posto l'utente incolla la
// chiave Steam Web API che genera dal proprio account.
// =============================================================================

import api from "./client";

// Collega l'account Steam.
//   profile — SteamID a 17 cifre, URL del profilo (/profiles/... o /id/...)
//             oppure il solo nome personalizzato: il backend normalizza.
//   apiKey  — chiave Steam Web API dell'utente (32 caratteri esadecimali).
//
// Va nel CORPO e non in query string: e' un segreto, e in query finirebbe negli
// access log del server e nella cronologia del browser.
// Risposta: { steamId, personaName }.
export function connectSteam({ profile, apiKey }) {
  return api.post("/api/integrations/steam/connect", { profile, apiKey });
}

// Sincronizza libreria e ore di gioco dall'account Steam collegato.
// Risposta: { ownedOnSteam, added, updated, skipped }.
export function syncSteam() {
  return api.post("/api/integrations/steam/sync");
}

// Scollega l'account Steam (azzera steamId e chiave API salvata).
export function disconnectSteam() {
  return api.delete("/api/integrations/steam");
}
