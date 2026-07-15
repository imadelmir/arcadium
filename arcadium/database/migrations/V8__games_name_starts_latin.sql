-- =============================================================================
-- Arcadium — ACE5
-- Milestone M6 — change request Negozio ("vetrina in caratteri europei")
-- Migrazione: flag games.name_starts_latin
--
-- Ottava migrazione versionata (V8), successiva a V6/V7 (collation e chiave di
-- ordinamento di name).
--
-- PROBLEMA
--   La vetrina del Negozio (ordinata per data di uscita, piu' recenti in cima)
--   viene invasa dai molti titoli asiatici o che iniziano con simboli/cifre
--   presenti nel dataset Steam. Si vuole che la pagina principale mostri solo i
--   titoli che INIZIANO con una lettera europea (latina), lasciando tutti gli
--   altri raggiungibili SOLO tramite la barra di ricerca.
--
-- SOLUZIONE
--   Colonna generata booleana name_starts_latin = true quando il primo carattere
--   del nome e' una lettera latina/europea. L'insieme di caratteri e' esplicito
--   (nessuna classe dipendente dal locale, cosi' l'espressione resta IMMUTABLE
--   come richiesto dalle colonne generate):
--     A-Z a-z            latino base (ASCII)
--     À-Ö Ø-ö ø-ÿ        Latin-1 (é, ñ, ü, à, ç, ...; esclusi × e ÷)
--     Ā-ſ                Latin Extended-A (č, š, ž, ł, ő, ...)
--   Il backend filtra su name_starts_latin=true SOLO quando la ricerca e' vuota:
--   con una query in barra il filtro si spegne e si cerca in tutto il catalogo.
--
-- NOTE
--   - Colonna di SOLA LETTURA: la calcola PostgreSQL, l'ETL non la inserisce.
--   - I titoli che iniziano con cifre o simboli (es. "7 Days...", "!AnyWay!") e
--     quelli non latini (cinese, coreano, ...) hanno il flag a false e restano
--     fuori dalla vetrina, ma sempre trovabili in ricerca.
--   - ALTER ... ADD COLUMN generata riscrive la tabella una volta (rapido sul
--     dataset del progetto). Forward-only: non tocca V1-V7.
-- =============================================================================

ALTER TABLE games
    ADD COLUMN name_starts_latin boolean
    GENERATED ALWAYS AS (name ~ '^[A-Za-zÀ-ÖØ-öø-ÿĀ-ſ]') STORED;

CREATE INDEX idx_games_name_starts_latin ON games (name_starts_latin);
