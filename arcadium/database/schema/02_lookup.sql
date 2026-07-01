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
