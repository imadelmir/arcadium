-- =============================================================================
-- Arcadium — ACE5
-- Milestone M4 — Backend · Task T17
-- Migrazione: token di recupero password (forgot/reset password)
--
-- Quinta migrazione versionata (V5), successiva a V1 (baseline), V2 (campi
-- utente), V3 (achievement) e V4 (tabelle future-ready). Aggiunge la tabella
-- password_reset_token, che sostiene il flusso di recupero password: l'utente
-- richiede il reset via email, riceve un link con un token monouso e a tempo,
-- e con quel token imposta una nuova password (endpoint in M4-T17).
--
-- Forward-only: NON modifica le migrazioni precedenti. Estende lo schema con
-- una nuova tabella agganciata ad app_user (gia' presente dalla baseline).
--
-- Scelte di sicurezza (coerenti con la filosofia di app_user.password_hash,
-- M4-T3: nulla di sensibile in chiaro):
--   - NON si salva il token in chiaro, ma il suo HASH SHA-256 (token_hash).
--     Cosi' una eventuale lettura del DB non espone token utilizzabili: il
--     token in chiaro vive solo nel link inviato all'utente.
--   - token_hash e' UNIQUE: identifica il record al momento del reset.
--   - expires_at rende il token a tempo (TTL breve, es. 30 min, M4-T17).
--   - used_at (nullable) rende il token MONOUSO: valorizzato al primo uso, cosi'
--     lo stesso link non puo' essere riutilizzato.
--   - ON DELETE CASCADE: se l'utente viene eliminato, spariscono anche i suoi
--     token pendenti.
--
-- Prerequisito: app_user creata dalla baseline (V1__baseline_schema.sql, M2-T3).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Tabella dei token di recupero password
-- -----------------------------------------------------------------------------

CREATE TABLE password_reset_token (
    id          BIGINT     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- chiave surrogata
    user_id     BIGINT     NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,  -- utente proprietario del token
    token_hash  TEXT       NOT NULL UNIQUE,                            -- SHA-256 del token (mai il token in chiaro)
    expires_at  TIMESTAMP  NOT NULL,                                   -- scadenza: oltre questo istante il token non vale piu'
    used_at     TIMESTAMP,                                             -- nullable: valorizzato al primo uso (token monouso)
    created_at  TIMESTAMP  NOT NULL DEFAULT now()                      -- istante di emissione
);


-- -----------------------------------------------------------------------------
-- 2. Indice per la ricerca dei token pendenti di un utente
--    Serve a invalidare/ripulire i token ancora validi quando se ne emette uno
--    nuovo o quando il reset va a buon fine (M4-T17). token_hash ha gia' il
--    proprio indice grazie all'UNIQUE.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_password_reset_token_user ON password_reset_token(user_id);


-- -----------------------------------------------------------------------------
-- 3. Commenti
-- -----------------------------------------------------------------------------

COMMENT ON TABLE  password_reset_token            IS 'Token monouso e a tempo per il recupero password (M4-T17). Popolata a runtime dalla richiesta di reset. Si conserva solo l''hash del token (token_hash), mai il token in chiaro, coerentemente con app_user.password_hash.';
COMMENT ON COLUMN password_reset_token.token_hash IS 'Hash SHA-256 del token di reset. Il token in chiaro esiste solo nel link inviato all''utente: dal DB non e'' ricavabile. UNIQUE perche'' identifica il record al momento del reset.';
COMMENT ON COLUMN password_reset_token.expires_at IS 'Istante di scadenza del token (TTL breve, es. 30 min). Oltre questo istante il reset viene rifiutato.';
COMMENT ON COLUMN password_reset_token.used_at    IS 'Istante di primo utilizzo del token; NULL se ancora non usato. Rende il token monouso: un link gia'' usato non e'' riutilizzabile.';
