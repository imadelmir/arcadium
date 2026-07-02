-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T4
-- DDL della parte dinamica libreria: backlog_status, wishlist, backlog
--
-- Traduce le associazioni con attributi wishlist e backlog e la lookup
-- backlog_status del modello dinamico M1 (T5 §4-§6) in DDL PostgreSQL. Sono le
-- ultime tre delle quattro tabelle dinamiche introdotte in T5; app_user è già
-- stata creata in M2-T3.
--
-- Perimetro di questo task:
--   - backlog_status : lookup degli stati (id PK, code UNIQUE, etichette IT/EN,
--                      sort_order); popolata da seed (database/seed)
--   - wishlist       : associazione DESIDERA, PK (user_id, app_id)
--   - backlog        : associazione POSSIEDE, PK (user_id, app_id), con stato,
--                      tempo di gioco e date di avanzamento
--   - indici                                    -> M2-T5
--
-- ON DELETE: CASCADE da app_user e da games (le librerie seguono utente e
-- gioco, coerente col catalogo T3/T4); RESTRICT verso backlog_status, così che
-- uno stato ancora in uso non sia cancellabile (T5 §8).
-- FK e PK compositi sono parte inscindibile delle tabelle e restano qui.
-- Prerequisiti: app_user (M2-T3) e games (M2-T1) già create.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Lookup degli stati del backlog (T5 §4, §6)
--    Modellata come tabella (non enum) per l'i18n IT/EN e per l'estensibilità
--    senza modifiche di schema. Popolata da seed:
--    mai_giocato, in_corso, finito, abbandonato.
-- -----------------------------------------------------------------------------

CREATE TABLE backlog_status (
    id          BIGINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- chiave surrogata (T5 §7)
    code        TEXT      NOT NULL UNIQUE,          -- 'mai_giocato' / 'in_corso' / 'finito' / 'abbandonato'
    label_it    TEXT      NOT NULL,                 -- etichetta interfaccia IT (i18n)
    label_en    TEXT      NOT NULL,                 -- etichetta interfaccia EN (i18n)
    sort_order  SMALLINT  NOT NULL                  -- ordinamento UI (T6 §7): mai giocato -> in corso -> finito -> abbandonato
);


-- -----------------------------------------------------------------------------
-- 2. wishlist — associazione DESIDERA app_user <-> games (T5 §4-§6)
--    Giochi che l'utente desidera acquistare. PK (user_id, app_id): un gioco
--    compare al piu' una volta per utente. CRUD esposto in M4-T7.
-- -----------------------------------------------------------------------------

CREATE TABLE wishlist (
    user_id   BIGINT     NOT NULL REFERENCES app_user(id)   ON DELETE CASCADE,
    app_id    BIGINT     NOT NULL REFERENCES games(app_id)  ON DELETE CASCADE,
    added_at  TIMESTAMP  NOT NULL DEFAULT now(),             -- data di inserimento in wishlist
    PRIMARY KEY (user_id, app_id)
);


-- -----------------------------------------------------------------------------
-- 3. backlog — associazione POSSIEDE app_user <-> games (T5 §4-§6)
--    Giochi posseduti, con stato, tempo di gioco e date di avanzamento.
--    PK (user_id, app_id). Endpoint per stato in M4-T8; sync Steam in M4-T16.
-- -----------------------------------------------------------------------------

CREATE TABLE backlog (
    user_id           BIGINT     NOT NULL REFERENCES app_user(id)        ON DELETE CASCADE,
    app_id            BIGINT     NOT NULL REFERENCES games(app_id)       ON DELETE CASCADE,
    status_id         BIGINT     NOT NULL REFERENCES backlog_status(id)  ON DELETE RESTRICT,  -- default 'mai_giocato' applicato dal servizio (M4-T8)
    playtime_minutes  INTEGER,                       -- tempo di gioco in minuti; da sync Steam (M4-T16)
    added_at          TIMESTAMP  NOT NULL DEFAULT now(),
    started_at        TIMESTAMP,                      -- valorizzata al passaggio a 'in corso'
    finished_at       TIMESTAMP,                      -- valorizzata al passaggio a 'finito'
    last_played_at    TIMESTAMP,                      -- ultima sessione (da sync)
    PRIMARY KEY (user_id, app_id),

    -- Vincoli di dominio (T5 §8)
    CONSTRAINT chk_backlog_playtime  CHECK (playtime_minutes IS NULL OR playtime_minutes >= 0),
    CONSTRAINT chk_backlog_dates     CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at)
);


-- -----------------------------------------------------------------------------
-- 4. Commenti
-- -----------------------------------------------------------------------------

COMMENT ON TABLE  backlog_status           IS 'Lookup degli stati del backlog (T5). Etichette bilingui IT/EN; popolata da seed (mai_giocato, in_corso, finito, abbandonato). Tabella, non enum, per estensibilita'' e i18n.';
COMMENT ON TABLE  wishlist                 IS 'Giochi che un utente desidera acquistare (associazione DESIDERA, T5). PK (user_id, app_id). Popolamento a runtime, CRUD in M4-T7.';
COMMENT ON TABLE  backlog                  IS 'Giochi posseduti da un utente, con stato e tempo di gioco (associazione POSSIEDE, T5). PK (user_id, app_id). Popolamento a runtime e sync Steam (M4-T8, M4-T16).';
COMMENT ON COLUMN backlog.status_id        IS 'Stato corrente nel backlog (FK backlog_status). NOT NULL; default ''mai_giocato'' applicato dal servizio (M4-T8) poiche'' l''id surrogato non e'' un default stabile a livello di schema. ON DELETE RESTRICT: uno stato in uso non e'' cancellabile.';
COMMENT ON COLUMN backlog.playtime_minutes IS 'Tempo di gioco in minuti; >= 0. Alimentato dalla sincronizzazione Steam (M4-T16).';
