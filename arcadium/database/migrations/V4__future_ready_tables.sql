-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T9
-- Migrazione: tabelle future-ready (notifiche e storico prezzi)
--
-- Quarta e ultima migrazione versionata di M2 (V4), dopo V1 (baseline),
-- V2 (campi utente) e V3 (achievement). Crea le tre tabelle future-ready del
-- modello M1-T7: notification, notification_preference e price_history.
-- Porta lo schema alle ventiquattro tabelle validate in M1 (M1-T7 §11).
--
-- Forward-only: NON modifica le migrazioni precedenti. Nuove tabelle via CREATE.
--
-- FUTURE-READY (M1-T7 §2): le tabelle esistono fin da subito, ma le funzioni che
-- le usano restano dietro feature flag SPENTO (notifiche calo prezzo, M4-T13)
-- finche' non se ne pianifica l'attivazione. price_history e' il presupposto
-- delle notifiche di calo prezzo: un job (M4-T13) registra i prezzi e, al calo
-- su un gioco in wishlist, crea una notification 'price_drop' nel rispetto di
-- notification_preference.
--
-- type (notification, notification_preference) e' TEXT libero: valori attuali
-- 'achievement_unlocked' / 'price_drop' / 'system' (M1-T7 §8), estensibile
-- senza modifiche di schema. Nessuna FK tra i due type: e' un semplice tag.
--
-- Nessun seed: queste tabelle si popolano a runtime (registrazione, job,
-- motore di sblocco), non hanno dati fissi come le lookup.
--
-- Prerequisiti: app_user e games gia' creati dalla baseline (V1, M2-T1/T3).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. notification — notifica destinata a un utente (M1-T7 §4, §7)
--    Entita' con chiave surrogata. type distingue achievement_unlocked /
--    price_drop / system. related_app_id: gioco collegato (es. calo prezzo),
--    nullable. ON DELETE CASCADE da app_user (le notifiche seguono l'utente);
--    ON DELETE SET NULL su related_app_id per non perdere la notifica se il
--    gioco viene rimosso (M1-T7 §9).
-- -----------------------------------------------------------------------------

CREATE TABLE notification (
    id              BIGINT     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- chiave surrogata
    user_id         BIGINT     NOT NULL REFERENCES app_user(id)  ON DELETE CASCADE,
    type            TEXT       NOT NULL,                    -- 'achievement_unlocked' / 'price_drop' / 'system'
    message         TEXT,                                   -- testo della notifica, nullable
    is_read         BOOLEAN    NOT NULL DEFAULT FALSE,      -- stato di lettura
    created_at      TIMESTAMP  NOT NULL DEFAULT now(),
    related_app_id  BIGINT     REFERENCES games(app_id)     ON DELETE SET NULL  -- gioco collegato, nullable
);


-- -----------------------------------------------------------------------------
-- 2. notification_preference — preferenze per tipo di notifica (M1-T7 §4, §7)
--    PK (user_id, type): una preferenza per utente e tipo. ON DELETE CASCADE
--    da app_user. enabled attiva/disattiva il tipo (default attivo).
-- -----------------------------------------------------------------------------

CREATE TABLE notification_preference (
    user_id   BIGINT   NOT NULL REFERENCES app_user(id)  ON DELETE CASCADE,
    type      TEXT     NOT NULL,                          -- tipo di notifica (parte della PK)
    enabled   BOOLEAN  NOT NULL DEFAULT TRUE,             -- notifica di questo tipo attiva?
    PRIMARY KEY (user_id, type)
);


-- -----------------------------------------------------------------------------
-- 3. price_history — storico prezzi di un gioco (M1-T7 §4, §7)
--    Base per le notifiche di calo prezzo (future-ready). PK (app_id,
--    recorded_at): una rilevazione per gioco e istante. ON DELETE CASCADE da
--    games. Popolato da un job (M4-T13).
-- -----------------------------------------------------------------------------

CREATE TABLE price_history (
    app_id       BIGINT         NOT NULL REFERENCES games(app_id)  ON DELETE CASCADE,
    recorded_at  TIMESTAMP      NOT NULL DEFAULT now(),             -- istante della rilevazione (parte della PK)
    price        NUMERIC(10,2)  NOT NULL,                           -- prezzo rilevato
    discount     SMALLINT,                                          -- sconto % al momento, nullable
    PRIMARY KEY (app_id, recorded_at),

    -- Vincoli di dominio (M1-T7 §9)
    CONSTRAINT chk_price_history_price     CHECK (price >= 0),
    CONSTRAINT chk_price_history_discount  CHECK (discount IS NULL OR discount BETWEEN 0 AND 100)
);


-- -----------------------------------------------------------------------------
-- 4. Indici (rinviati qui da M2-T5)
--    notification: la PK e' l'id surrogato, quindi user_id e related_app_id non
--    sono coperti. user_id serve per "notifiche dell'utente" e per la cascata
--    da app_user; related_app_id per l'ON DELETE SET NULL e per "notifiche su
--    questo gioco".
--    notification_preference e price_history NON richiedono indici aggiuntivi:
--    la prima colonna della PK (user_id / app_id) copre gia' accesso e cascata.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_notification_user_id         ON notification (user_id);
CREATE INDEX idx_notification_related_app_id  ON notification (related_app_id);


-- -----------------------------------------------------------------------------
-- 5. Commenti
-- -----------------------------------------------------------------------------

COMMENT ON TABLE  notification                IS 'Notifica destinata a un utente (achievement sbloccato, calo prezzo, sistema), con stato di lettura (M1-T7). Popolamento a runtime; calo prezzo future-ready dietro feature flag (M4-T13).';
COMMENT ON COLUMN notification.type           IS 'Tipo di notifica: achievement_unlocked / price_drop / system (M1-T7 §8). TEXT libero, estensibile senza modifiche di schema.';
COMMENT ON COLUMN notification.related_app_id IS 'Gioco collegato alla notifica (es. calo prezzo), nullable. ON DELETE SET NULL: se il gioco viene rimosso la notifica resta.';
COMMENT ON TABLE  notification_preference     IS 'Preferenze dell''utente per tipo di notifica (attiva/disattiva). PK (user_id, type). Default enabled = true.';
COMMENT ON TABLE  price_history               IS 'Storico prezzi di un gioco nel tempo (M1-T7): base per le notifiche di calo prezzo (future-ready, M4-T13). PK (app_id, recorded_at). Popolato da un job.';
