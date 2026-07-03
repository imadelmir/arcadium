-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T7
-- Migrazione: campi di integrazione e i18n su app_user
--
-- Seconda migrazione versionata (V2), successiva alla baseline V1. Aggiunge ad
-- app_user i campi di profilo rinviati da M2-T3, previsti nel modello utente
-- M1 (T5 §6): la lingua dell'interfaccia e i campi di integrazione (Steam,
-- Discord, Twitch). In M2-T3 app_user e' stata creata coi soli campi di
-- account e profilo di base; qui la si completa.
--
-- Forward-only: NON modifica V1__baseline_schema.sql (una migrazione applicata
-- non si riscrive mai; si corregge in avanti). Le colonne si aggiungono con
-- ALTER TABLE.
--
-- Campi aggiunti (M1-T5, tabella degli attributi):
--   - preferred_language  VARCHAR(2)  lingua UI 'it'/'en', default 'it'.
--                         NON e' una FK verso la lookup language (lingue dei
--                         giochi): e' la lingua dell'interfaccia i18n (M5-T3),
--                         concetto distinto (T5). Dominio {'it','en'} (T5 §8).
--   - steam_id            TEXT  nullable e UNIQUE. Connect Steam via OpenID e
--                         sync libreria/tempo di gioco (M4-T16). L'UNIQUE crea
--                         gia' il proprio indice (anticipato in M2-T5).
--   - discord_url         TEXT  nullable. Link social (M4-T15, pulsanti M5-T6).
--   - twitch_url          TEXT  nullable. Link social (M4-T15, pulsanti M5-T6).
--
-- games.header_image e' gia' presente nel catalogo statico (M2-T1, in V1): e'
-- un campo del dataset Steam usato da GameImage (M5-T7) e NON viene ri-aggiunto
-- qui.
--
-- Estensioni successive: achievement / user_achievement (M2-T8) -> V3;
-- price_history / notification.. (M2-T9) -> V4.
--
-- Prerequisito: app_user creata dalla baseline (V1__baseline_schema.sql, M2-T3).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Colonne di integrazione e i18n su app_user (T5 §6)
-- -----------------------------------------------------------------------------

ALTER TABLE app_user
    ADD COLUMN preferred_language  VARCHAR(2)  NOT NULL DEFAULT 'it',  -- lingua UI i18n (M5-T3); non FK verso language (T5)
    ADD COLUMN steam_id            TEXT        UNIQUE,                  -- SteamID, nullable e univoco; connect Steam (M4-T16)
    ADD COLUMN discord_url         TEXT,                               -- link social Discord (M4-T15, M5-T6)
    ADD COLUMN twitch_url          TEXT;                               -- link social Twitch  (M4-T15, M5-T6)


-- -----------------------------------------------------------------------------
-- 2. Vincolo di dominio sulla lingua dell'interfaccia (T5 §8)
--    Coerente con l'i18n IT/EN della piattaforma (M5-T3).
-- -----------------------------------------------------------------------------

ALTER TABLE app_user
    ADD CONSTRAINT chk_app_user_preferred_language
        CHECK (preferred_language IN ('it', 'en'));


-- -----------------------------------------------------------------------------
-- 3. Commenti
-- -----------------------------------------------------------------------------

COMMENT ON COLUMN app_user.preferred_language IS 'Lingua dell''interfaccia (i18n IT/EN, M5-T3): ''it'' o ''en'', default ''it''. Concetto distinto dalla lookup language (lingue dei giochi): e'' un campo a se'', non una FK (T5).';
COMMENT ON COLUMN app_user.steam_id           IS 'SteamID dell''utente: nullable e univoco. Popolato dal connect Steam via OpenID; usato per la sync di libreria e tempo di gioco (M4-T16). L''UNIQUE fornisce gia'' il proprio indice.';
COMMENT ON COLUMN app_user.discord_url        IS 'Link al profilo Discord dell''utente, nullable. Mostrato dai pulsanti social (M4-T15, M5-T6).';
COMMENT ON COLUMN app_user.twitch_url         IS 'Link al canale Twitch dell''utente, nullable. Mostrato dai pulsanti social (M4-T15, M5-T6).';
