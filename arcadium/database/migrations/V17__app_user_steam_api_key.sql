-- =============================================================================
-- V17 — Chiave Steam Web API dell'utente (integrazione "porta la tua chiave")
-- -----------------------------------------------------------------------------
-- Il collegamento a Steam non passa piu' dal login OpenID (che non consente di
-- leggere la libreria: per GetOwnedGames serve comunque una chiave della Steam
-- Web API). L'utente genera la PROPRIA chiave su
-- https://steamcommunity.com/dev/apikey e la incolla in Arcadium; da quel
-- momento la sync di libreria e tempo di gioco usa quella chiave.
--
--   * steam_api_key : chiave Steam Web API dell'utente, CIFRATA (AES-256-GCM,
--                     Base64 di iv||ciphertext) — vedi security/SecretCipher.
--                     Mai in chiaro, ne' a riposo ne' nelle risposte dell'API:
--                     il backend la decifra solo per la durata della chiamata a
--                     Steam. NULL = nessun account Steam collegato.
--
-- Coppia inseparabile con steam_id (V2): il connect valorizza entrambe le
-- colonne, lo scollega le azzera entrambe. Nessun UNIQUE: due utenti che per
-- errore usassero la stessa chiave sarebbero comunque bloccati dall'UNIQUE su
-- steam_id (un account Steam = un utente Arcadium).
--
-- Nessun backfill possibile: la chiave la puo' produrre solo l'utente. Gli
-- steam_id rimasti dai test del vecchio connect OpenID vengono percio' azzerati
-- qui: senza chiave non sono utilizzabili, e lasciarli darebbe un profilo
-- "collegato" a meta' — l'interfaccia mostrerebbe l'account come collegato
-- (si basa su steam_id) mentre ogni sincronizzazione risponderebbe "Steam non
-- collegato". Meglio ripartire puliti: l'utente ricollega in un passaggio.
--
-- Prerequisito: app_user.steam_id (V2__user_integration_fields.sql, M2-T7).
-- =============================================================================

ALTER TABLE app_user
    ADD COLUMN steam_api_key TEXT;

-- Collegamenti Steam senza chiave: inservibili, si azzerano.
UPDATE app_user
   SET steam_id = NULL
 WHERE steam_id IS NOT NULL
   AND steam_api_key IS NULL;

COMMENT ON COLUMN app_user.steam_api_key IS 'Chiave Steam Web API dell''utente, cifrata con AES-256-GCM e codificata Base64 (iv||ciphertext). Generata dall''utente su steamcommunity.com/dev/apikey e usata per GetOwnedGames durante la sync. Mai restituita dall''API, nemmeno mascherata. NULL = Steam non collegato: steam_id e steam_api_key si valorizzano e si azzerano sempre insieme.';
