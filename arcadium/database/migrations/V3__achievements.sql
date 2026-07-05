-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T8
-- Migrazione: achievement interni e sblocchi utente
--
-- Terza migrazione versionata (V3), successiva a V1 (baseline) e V2 (campi
-- utente). Crea le due tabelle del sistema di achievement interni modellato in
-- M1-T7: achievement (catalogo dei badge) e user_achievement (sblocchi degli
-- utenti). Si aggancia ad app_user, gia' presente dalla baseline (M2-T3).
--
-- Forward-only: NON modifica V1 ne' V2. Estende lo schema con nuove tabelle.
--
-- Achievement INTERNI (proprietari di Arcadium): gamification data-driven
-- (M1-T7 §2-§3). Concetto distinto da games.achievements_count, che e' il
-- numero di achievement Steam del gioco (dato statico dal dataset, M2-T1).
--
-- Data-driven (M1-T7 §3): ogni definizione porta una metric (cosa si misura,
-- es. games_owned) e una threshold (soglia). Il motore di sblocco (M4-T11)
-- confronta la metrica derivata da backlog/wishlist dell'utente con la soglia,
-- senza codice dedicato per ogni badge. Le definizioni si caricano da seed
-- ripetibile (R__achievements.sql) e sono estensibili senza modifiche di
-- schema: per questo metric e' TEXT libero, senza CHECK di dominio.
--
-- Le tabelle future-ready (notification, notification_preference,
-- price_history) seguono in M2-T9 -> V4.
--
-- Prerequisito: app_user creata dalla baseline (V1__baseline_schema.sql, M2-T3).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. achievement — catalogo dei badge (entita' forte, M1-T7 §4, §7)
--    Chiave surrogata id; code UNIQUE stabile (come le lookup di T2/T5).
--    Etichette bilingui name_it/name_en, description_it/description_en per
--    l'i18n IT/EN (coerente con backlog_status, T5). Caricato da seed.
--    Gli achievement NON si cancellano: si disattivano (is_active = false), per
--    non perdere gli sblocchi storici degli utenti (M1-T7 §3).
-- -----------------------------------------------------------------------------

CREATE TABLE achievement (
    id              BIGINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- chiave surrogata (M1-T7 §7)
    code            TEXT      NOT NULL UNIQUE,          -- identificatore stabile (es. 'finisher_10')
    name_it         TEXT      NOT NULL,                 -- nome del badge IT (i18n)
    name_en         TEXT      NOT NULL,                 -- nome del badge EN (i18n)
    description_it  TEXT,                               -- descrizione IT, nullable (i18n)
    description_en  TEXT,                               -- descrizione EN, nullable (i18n)
    icon_url        TEXT,                               -- icona del badge, nullable
    metric          TEXT      NOT NULL,                 -- cosa si misura; TEXT libero (data-driven, no CHECK)
    threshold       INTEGER   NOT NULL,                 -- valore da raggiungere
    points          SMALLINT  NOT NULL DEFAULT 0,       -- punti gamification
    is_active       BOOLEAN   NOT NULL DEFAULT TRUE,    -- disattivazione soft (mai delete)

    -- Vincoli di dominio (M1-T7 §9)
    CONSTRAINT chk_achievement_threshold  CHECK (threshold >= 1),
    CONSTRAINT chk_achievement_points     CHECK (points >= 0)
);


-- -----------------------------------------------------------------------------
-- 2. user_achievement — sblocchi (associazione M-N, M1-T7 §6, §7)
--    PK composta (user_id, achievement_id): un solo sblocco per utente e badge.
--    ON DELETE CASCADE da app_user: gli sblocchi seguono l'utente.
--    ON DELETE RESTRICT verso achievement: un badge con sblocchi storici non e'
--    cancellabile (si disattiva), stesso criterio di backlog -> backlog_status.
-- -----------------------------------------------------------------------------

CREATE TABLE user_achievement (
    user_id         BIGINT     NOT NULL REFERENCES app_user(id)     ON DELETE CASCADE,
    achievement_id  BIGINT     NOT NULL REFERENCES achievement(id)  ON DELETE RESTRICT,
    unlocked_at     TIMESTAMP  NOT NULL DEFAULT now(),               -- momento dello sblocco
    PRIMARY KEY (user_id, achievement_id)
);


-- -----------------------------------------------------------------------------
-- 3. Indici (rinviati qui da M2-T5)
--    La PK (user_id, achievement_id) copre gia' l'accesso per utente e la
--    cascata da app_user. Serve l'indice sulla seconda colonna per il supporto
--    della FK verso achievement (ON DELETE RESTRICT) e per la query "chi ha
--    sbloccato questo badge". achievement.code e' gia' indicizzato dall'UNIQUE.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_user_achievement_achievement ON user_achievement (achievement_id);


-- -----------------------------------------------------------------------------
-- 4. Commenti
-- -----------------------------------------------------------------------------

COMMENT ON TABLE  achievement            IS 'Catalogo degli achievement interni di Arcadium (gamification data-driven, M1-T7). Distinto da games.achievements_count (achievement Steam del dataset). Caricato da seed (R__achievements.sql); estensibile senza modifiche di schema.';
COMMENT ON COLUMN achievement.metric     IS 'Metrica valutata dal motore di sblocco (M4-T11): games_owned, games_finished, games_abandoned, games_in_progress, playtime_hours, wishlist_size, distinct_genres. TEXT libero per estensibilita'' data-driven.';
COMMENT ON COLUMN achievement.is_active  IS 'Disattivazione soft: un achievement non si elimina (si perderebbero gli sblocchi storici), si imposta is_active = false.';
COMMENT ON TABLE  user_achievement       IS 'Sblocchi degli achievement da parte degli utenti (associazione SBLOCCA, M1-T7). PK (user_id, achievement_id): un solo sblocco per utente e badge. Popolato a runtime dal motore di sblocco (M4-T11).';
