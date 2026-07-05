-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T6
-- Migrazione di baseline: schema completo del modello validato in M1 (T6)
--
-- Prima migrazione versionata dello schema. Assembla in un unico passo
-- ordinato (forward-only) i DDL prodotti in M2-T1..T5, cioe' le diciannove
-- tabelle del modello dati validato in M1-T6:
--   - catalogo statico (15): games, sei lookup, sette ponte, game_screenshot
--   - parte dinamica  (4):   app_user, backlog_status, wishlist, backlog
-- piu' gli indici di M2-T5 e l'estensione pg_trgm per la ricerca testuale.
--
-- Questo file NON e' una riscrittura: e' l'unione fedele dei file di
-- database/schema/ (01_games .. 05_indexes) nell'ordine di dipendenza
-- (estensione -> tabelle senza FK -> tabelle con FK -> indici). I file di
-- schema/ restano la copia di riferimento per concern; questa migrazione e'
-- la copia eseguibile e versionata (vedi migrations/README.md).
--
-- Convenzione di naming: Flyway (V<versione>__<descrizione>.sql). Le estensioni
-- successive dello schema NON modificano questo file, ma aggiungono nuove
-- migrazioni:
--   - campi utente + header_image     (M2-T7) -> V2__user_integration_fields.sql
--   - achievement / user_achievement  (M2-T8) -> V3__achievements.sql
--   - price_history / notification..  (M2-T9) -> V4__future_ready_tables.sql
-- I dati fissi (seed) sono migrazioni ripetibili R__*.sql in database/seed/.
--
-- Idempotenza: Flyway esegue ogni migrazione una sola volta e in transazione
-- (DDL transazionale in PostgreSQL): il file gira per intero o non gira.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Estensioni
--    pg_trgm abilita gli indici GIN a trigrammi per la ricerca per sottostringa
--    (ILIKE '%...%') su games.name e app_user.display_name (spostata qui dal
--    file indici di M2-T5, come anticipato nella nota di 05_indexes.sql).
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_trgm;




-- #############################################################################
-- # M2-T1 · Tabella catalogo: games
-- #############################################################################

-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T1
-- DDL della tabella catalogo giochi: games
--
-- Traduce l'entità forte GAMES del modello M1 (T3 §4, T4 §5) in DDL PostgreSQL.
-- 30 attributi a valore singolo derivati dal dataset steam_games.json (T2 §3).
-- Chiave primaria naturale app_id (T1 §4: 122.479 AppID distinti, 0 duplicati).
--
-- Perimetro di questo task: SOLO la tabella games.
--   - lookup e tabelle ponte      -> M2-T2
--   - indici (es. su name)        -> M2-T5
-- I vincoli di dominio su games (T3 §5) sono parte inscindibile della tabella
-- e restano qui.
-- =============================================================================

CREATE TABLE games (
    app_id                      BIGINT       PRIMARY KEY,     -- PK naturale dal dataset
    name                        TEXT         NOT NULL,        -- unica riga senza nome gestita in ETL
    release_date                DATE,                         -- parse da testo ('Aug 1, 2023'); null se non interpretabile
    owners_min                  BIGINT,                       -- da split di 'Estimated owners' (es. '0 - 20000')
    owners_max                  BIGINT,
    peak_ccu                    INTEGER,
    required_age                SMALLINT,
    price                       NUMERIC(10,2),                -- 0 = gratis (valore reale)
    discount                    SMALLINT,                     -- percentuale 0-100
    dlc_count                   INTEGER,
    about_the_game              TEXT,
    reviews                     TEXT,                         -- nullable, basso valore
    header_image                TEXT,                         -- immagine di copertina (usata da GameImage M5-T7)
    website                     TEXT,
    support_url                 TEXT,
    support_email               TEXT,
    windows                     BOOLEAN,
    mac                         BOOLEAN,
    linux                       BOOLEAN,
    metacritic_score            SMALLINT,                     -- nullable, 0 = nessun voto
    metacritic_url              TEXT,
    positive                    INTEGER,
    negative                    INTEGER,
    achievements_count          INTEGER,                      -- n. achievement Steam (dato statico, != achievement interni T7)
    recommendations             INTEGER,
    notes                       TEXT,
    avg_playtime_forever        INTEGER,
    avg_playtime_two_weeks      INTEGER,
    median_playtime_forever     INTEGER,
    median_playtime_two_weeks   INTEGER,

    -- Vincoli di dominio (T3 §5)
    CONSTRAINT chk_games_discount      CHECK (discount IS NULL OR discount BETWEEN 0 AND 100),
    CONSTRAINT chk_games_price         CHECK (price IS NULL OR price >= 0),
    CONSTRAINT chk_games_owners_range  CHECK (owners_max IS NULL OR owners_min IS NULL OR owners_max >= owners_min),
    CONSTRAINT chk_games_required_age  CHECK (required_age IS NULL OR required_age >= 0)
);

COMMENT ON TABLE  games                    IS 'Catalogo statico dei giochi Steam (fonte: steam_games.json). Popolamento via ETL in M3.';
COMMENT ON COLUMN games.achievements_count IS 'Numero di achievement Steam del gioco: dato statico dal dataset, distinto dal sistema di achievement interni (T7).';
COMMENT ON COLUMN games.metacritic_score   IS 'Nullable; 0 = nessun voto Metacritic.';


-- #############################################################################
-- # M2-T2 · Lookup, tabelle ponte, entita' debole game_screenshot
-- #############################################################################

-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T2
-- DDL delle lookup, delle tabelle ponte e dell'entità debole game_screenshot
--
-- Traduce la parte restante del catalogo statico M1 (T3 §4, T4 §5) in DDL
-- PostgreSQL. Completa le quindici tabelle di catalogo iniziate in M2-T1.
--
-- Perimetro di questo task:
--   - sei lookup (chiave surrogata id, name UNIQUE):
--       language, developer, publisher, category, genre, tag
--   - sette ponte molti-a-molti (PK composta delle due FK, ON DELETE CASCADE):
--       game_language, game_audio_language, game_developer, game_publisher,
--       game_category, game_genre, game_tag
--   - entità debole: game_screenshot, chiave (app_id, url)
--   - indici (es. su name)        -> M2-T5
--
-- FK e PK compositi sono parte inscindibile delle tabelle e restano qui.
-- Prerequisito: games (M2-T1) già creata.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Tabelle di lookup (T3 §4, T4 §5)
--    Chiave surrogata id; name univoco e obbligatorio.
-- -----------------------------------------------------------------------------

CREATE TABLE language (
    id      INTEGER  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name    TEXT     NOT NULL UNIQUE
);

CREATE TABLE developer (
    id      INTEGER  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name    TEXT     NOT NULL UNIQUE                            -- pulizia/dedup in ETL (M3-T3)
);

CREATE TABLE publisher (
    id      INTEGER  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name    TEXT     NOT NULL UNIQUE                            -- pulizia/dedup in ETL (M3-T3)
);

CREATE TABLE category (
    id      INTEGER  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name    TEXT     NOT NULL UNIQUE
);

CREATE TABLE genre (
    id      INTEGER  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name    TEXT     NOT NULL UNIQUE
);

CREATE TABLE tag (
    id      INTEGER  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name    TEXT     NOT NULL UNIQUE
);


-- -----------------------------------------------------------------------------
-- 2. Tabelle ponte molti-a-molti (T4 §6)
--    PK composta (app_id, <lookup>_id); FK verso games e verso la lookup.
--    ON DELETE CASCADE: eliminando un gioco si rimuovono i suoi collegamenti.
-- -----------------------------------------------------------------------------

CREATE TABLE game_language (
    app_id       BIGINT   NOT NULL REFERENCES games(app_id)  ON DELETE CASCADE,
    language_id  INTEGER  NOT NULL REFERENCES language(id)    ON DELETE CASCADE,
    PRIMARY KEY (app_id, language_id)
);

CREATE TABLE game_audio_language (
    app_id       BIGINT   NOT NULL REFERENCES games(app_id)  ON DELETE CASCADE,
    language_id  INTEGER  NOT NULL REFERENCES language(id)    ON DELETE CASCADE,
    PRIMARY KEY (app_id, language_id)
);

CREATE TABLE game_developer (
    app_id        BIGINT   NOT NULL REFERENCES games(app_id)   ON DELETE CASCADE,
    developer_id  INTEGER  NOT NULL REFERENCES developer(id)   ON DELETE CASCADE,
    PRIMARY KEY (app_id, developer_id)
);

CREATE TABLE game_publisher (
    app_id        BIGINT   NOT NULL REFERENCES games(app_id)   ON DELETE CASCADE,
    publisher_id  INTEGER  NOT NULL REFERENCES publisher(id)   ON DELETE CASCADE,
    PRIMARY KEY (app_id, publisher_id)
);

CREATE TABLE game_category (
    app_id       BIGINT   NOT NULL REFERENCES games(app_id)   ON DELETE CASCADE,
    category_id  INTEGER  NOT NULL REFERENCES category(id)    ON DELETE CASCADE,
    PRIMARY KEY (app_id, category_id)
);

CREATE TABLE game_genre (
    app_id     BIGINT   NOT NULL REFERENCES games(app_id)  ON DELETE CASCADE,
    genre_id   INTEGER  NOT NULL REFERENCES genre(id)      ON DELETE CASCADE,
    PRIMARY KEY (app_id, genre_id)
);

CREATE TABLE game_tag (
    app_id   BIGINT   NOT NULL REFERENCES games(app_id)  ON DELETE CASCADE,
    tag_id   INTEGER  NOT NULL REFERENCES tag(id)        ON DELETE CASCADE,
    PRIMARY KEY (app_id, tag_id)
);


-- -----------------------------------------------------------------------------
-- 3. Entità debole game_screenshot (T3 §4, T4 §5)
--    Non esiste senza il gioco: chiave (app_id, url), FK identificante su games.
-- -----------------------------------------------------------------------------

CREATE TABLE game_screenshot (
    app_id  BIGINT  NOT NULL REFERENCES games(app_id)  ON DELETE CASCADE,
    url     TEXT    NOT NULL,
    PRIMARY KEY (app_id, url)
);


-- -----------------------------------------------------------------------------
-- 4. Commenti
-- -----------------------------------------------------------------------------

COMMENT ON TABLE language             IS 'Lookup lingue. Popolamento via ETL in M3.';
COMMENT ON TABLE developer            IS 'Lookup sviluppatori. Nomi puliti e deduplicati in ETL (M3-T3).';
COMMENT ON TABLE publisher            IS 'Lookup publisher. Nomi puliti e deduplicati in ETL (M3-T3).';
COMMENT ON TABLE category             IS 'Lookup categorie Steam.';
COMMENT ON TABLE genre                IS 'Lookup generi.';
COMMENT ON TABLE tag                  IS 'Lookup tag.';

COMMENT ON TABLE game_language        IS 'Lingue supportate (interfaccia/sottotitoli): associazione SUPPORTA (T4 §6).';
COMMENT ON TABLE game_audio_language  IS 'Lingue con audio completo: associazione HA_AUDIO_IN, sottoinsieme delle supportate (T4 §6).';
COMMENT ON TABLE game_screenshot      IS 'Entità debole: screenshot del gioco (uno-a-molti), chiave (app_id, url). Popolamento via ETL in M3.';


-- #############################################################################
-- # M2-T3 · Utenti e profilo: app_user
-- #############################################################################

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


-- #############################################################################
-- # M2-T4 · Parte dinamica libreria: backlog_status, wishlist, backlog
-- #############################################################################

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


-- #############################################################################
-- # M2-T5 · Indici (ricerca, filtri, supporto FK)
-- #############################################################################

-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T5
-- Indici, vincoli di integrita' e chiavi esterne
--
-- Chiavi primarie, chiavi esterne e vincoli di dominio (CHECK) sono gia'
-- applicati inline nei file delle rispettive tabelle (M2-T1..T4), essendo
-- parte inscindibile della definizione:
--   - games          -> PK app_id, CHECK discount/price/owners/required_age  (01_games.sql)
--   - lookup/ponte    -> id/name UNIQUE, PK composte, FK ON DELETE CASCADE    (02_lookup.sql)
--   - app_user        -> PK id, username/email UNIQUE                        (03_users.sql)
--   - wishlist/backlog-> PK (user_id, app_id), FK, playtime >= 0, RESTRICT    (04_wishlist_backlog.sql)
-- Questo task NON li riscrive: li da' per acquisiti e si concentra sugli
-- indici che li rendono efficienti (in particolare gli indici a supporto
-- delle FK, che PostgreSQL non crea in automatico).
--
-- Perimetro di questo task: indici per ricerca, filtri e integrita' referenziale
-- sulle diciannove tabelle del modello validato in M1 (T6): catalogo (T1-T2) e
-- parte dinamica utenti/wishlist/backlog (T3-T4).
--   - indici di achievement / user_achievement                     -> M2-T8
--   - indici di notification / notification_preference / price_history -> M2-T9
-- entrambi rinviati perche' quelle tabelle vengono create dopo questo task.
--
-- Prerequisito: tabelle di M2-T1..T4 gia' create.
-- Nota ETL (M3): al carico massivo (~122k giochi) questi indici sono
-- accettabili; eventuali indici analitici aggiuntivi si valutano dopo profiling.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Estensione per la ricerca testuale
--    pg_trgm abilita gli indici GIN a trigrammi per la ricerca per sottostringa
--    (ILIKE '%...%') su nome gioco e display_name utente.
--    Puo' essere spostata nel setup di migrazione (M2-T6): qui e' idempotente.
-- -----------------------------------------------------------------------------

-- (pg_trgm gia' creata nella sezione 0 di questa migrazione di baseline)


-- -----------------------------------------------------------------------------
-- 1. Catalogo: ricerca e filtri sui giochi (requisito "ricerca sui giochi")
--    La PK app_id copre gia' l'accesso per chiave. Qui si indicizzano le
--    colonne usate dalla ricerca testuale e dai filtri/ordinamenti del catalogo.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_games_name_trgm     ON games USING gin (name gin_trgm_ops);  -- ricerca catalogo per sottostringa (ILIKE)
CREATE INDEX idx_games_name          ON games (name);                          -- ordinamento alfabetico / ricerca per prefisso
CREATE INDEX idx_games_release_date  ON games (release_date);                  -- filtro/ordinamento "novita'", per anno
CREATE INDEX idx_games_price         ON games (price);                         -- filtro per fascia di prezzo / gratis
CREATE INDEX idx_games_metacritic    ON games (metacritic_score);             -- ordinamento per voto Metacritic

-- Candidati ulteriori (peak_ccu, positive, recommendations) rinviati: si
-- aggiungono solo se il profiling delle query di M4/M5 ne mostra il bisogno.


-- -----------------------------------------------------------------------------
-- 2. Tabelle ponte: indici a supporto delle FK (direzione lookup -> games)
--    La PK composta (app_id, <lookup>_id) indicizza gia' la direzione
--    games -> lookup e la cancellazione a cascata di un gioco. Serve invece un
--    indice sulla SECONDA colonna per:
--      a) le query di filtro del catalogo ("tutti i giochi con genere/tag X");
--      b) l'ON DELETE CASCADE quando si elimina una riga di lookup.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_game_language_language        ON game_language (language_id);
CREATE INDEX idx_game_audio_language_language  ON game_audio_language (language_id);
CREATE INDEX idx_game_developer_developer      ON game_developer (developer_id);
CREATE INDEX idx_game_publisher_publisher      ON game_publisher (publisher_id);
CREATE INDEX idx_game_category_category        ON game_category (category_id);
CREATE INDEX idx_game_genre_genre              ON game_genre (genre_id);
CREATE INDEX idx_game_tag_tag                  ON game_tag (tag_id);

-- game_screenshot: nessun indice aggiuntivo. La PK (app_id, url) ha app_id come
-- prima colonna e copre l'unico accesso previsto (screenshot per gioco).


-- -----------------------------------------------------------------------------
-- 3. Utenti: ricerca (requisito "ricerca sugli utenti")
--    username ed email sono gia' indicizzati dai vincoli UNIQUE (03_users.sql);
--    steam_id UNIQUE (M2-T7) lo sara' analogamente. Resta da coprire
--    display_name, usato nella ricerca utenti.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_app_user_display_name_trgm ON app_user USING gin (display_name gin_trgm_ops);  -- ricerca utenti per display_name


-- -----------------------------------------------------------------------------
-- 4. Wishlist e backlog: indici a supporto delle FK e dei filtri
--    La PK (user_id, app_id) copre gia' l'accesso per utente (user_id prima
--    colonna) e la cascata dall'utente. Servono gli indici sulle altre FK.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_wishlist_app_id    ON wishlist (app_id);      -- FK -> games (cascade) + "chi ha in wishlist questo gioco"

CREATE INDEX idx_backlog_app_id     ON backlog (app_id);       -- FK -> games (cascade)
CREATE INDEX idx_backlog_status_id  ON backlog (status_id);    -- FK -> backlog_status (RESTRICT) + filtro/statistiche per stato
