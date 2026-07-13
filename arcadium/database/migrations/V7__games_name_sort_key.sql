-- =============================================================================
-- Arcadium — ACE5
-- Milestone M5 — Frontend · change request Negozio ("Nome A-Z / Z-A")
-- Migrazione: chiave di ordinamento alfabetico games.name_sort
--
-- Settima migrazione versionata (V7), successiva a V6 (collation di name).
--
-- PROBLEMA
--   Ordinando per name, i titoli che iniziano con simboli (!, #, _) o cifre
--   finivano prima della "A", e quelli non latini (cinese, coreano) restavano
--   fuori posto. Si vuole un ordinamento "da libreria": prima le lettere latine
--   A-Z (o Z-A), ignorando i caratteri iniziali non-lettera, con i titoli senza
--   lettera latina in fondo.
--
-- SOLUZIONE
--   Colonna generata name_sort = nome minuscolo ripulito dei caratteri iniziali
--   non-lettera (regexp_replace su '^[^a-zA-Z]+'); NULL quando dopo la pulizia
--   non resta nulla (titoli di soli numeri/simboli o non latini). Il backend
--   ordina su name_sort con "NULLS LAST", così i NULL restano in coda sia in
--   ASC sia in DESC. COLLATE "C" per un ordine ASCII deterministico.
--
-- NOTE
--   - Colonna di SOLA LETTURA: la calcola PostgreSQL, l'ETL non la inserisce.
--   - ALTER ... ADD COLUMN generata riscrive la tabella una volta (rapido sul
--     dataset del progetto). Forward-only: non tocca V1-V6.
-- =============================================================================

ALTER TABLE games
    ADD COLUMN name_sort text COLLATE "C"
    GENERATED ALWAYS AS (
        NULLIF(lower(regexp_replace(name, '^[^a-zA-Z]+', '')), '')
    ) STORED;

CREATE INDEX idx_games_name_sort ON games (name_sort);
