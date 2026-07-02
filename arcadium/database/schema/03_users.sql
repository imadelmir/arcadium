-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T3
-- DDL della tabella utenti e profilo: app_user
--
-- Traduce l'entità forte app_user del modello dinamico M1 (T5 §6) in DDL
-- PostgreSQL. Terza delle quattro tabelle dinamiche introdotte in T5
-- (app_user, backlog_status, wishlist, backlog).
--
-- Nome app_user (non user): user è parola riservata in PostgreSQL (T5 §3).
-- Le password non sono mai in chiaro: si conserva solo password_hash con salt;
-- l'autenticazione è a token JWT (T5 §3, M4-T3).
--
-- Perimetro di questo task: SOLO la tabella app_user, coi campi di account e
-- profilo di base.
--   - campi integrazione/i18n (preferred_language, steam_id,
--     discord_url, twitch_url)                         -> M2-T7
--   - backlog_status, wishlist, backlog                -> M2-T4
--   - indici                                           -> M2-T5
-- =============================================================================

CREATE TABLE app_user (
    id                  BIGINT     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- chiave surrogata (T5 §7)
    username            TEXT       NOT NULL UNIQUE,             -- credenziale, univoca
    email               TEXT       NOT NULL UNIQUE,             -- credenziale, univoca
    password_hash       TEXT       NOT NULL,                    -- hash con salt; mai in chiaro (auth JWT, M4-T3)
    display_name        TEXT,                                   -- nome visualizzato, nullable
    avatar_url          TEXT,                                   -- nullable
    is_profile_public   BOOLEAN    NOT NULL DEFAULT TRUE,       -- visibilità nelle ricerche utente; profilo privato in M5-T15
    created_at          TIMESTAMP  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  app_user                   IS 'Utente registrato della piattaforma (parte dinamica, T5). Nome app_user perché user è riservato in PostgreSQL. Popolamento a runtime (registrazione, M4-T2).';
COMMENT ON COLUMN app_user.password_hash     IS 'Hash della password con salt; mai memorizzata in chiaro. Autenticazione a token JWT (M4-T3).';
COMMENT ON COLUMN app_user.is_profile_public IS 'Visibilità del profilo nelle ricerche utente; default pubblico. Profilo privato gestito in M5-T15.';
