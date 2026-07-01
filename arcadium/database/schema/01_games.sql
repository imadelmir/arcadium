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
