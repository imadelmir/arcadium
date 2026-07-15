-- =============================================================================
-- Arcadium — ACE5
-- Milestone M6 — bug fixing (ricerca catalogo)
-- Migrazione: indice trigram su lower(name)
--
-- Tredicesima migrazione versionata (V13), successiva a V12.
--
-- PROBLEMA (diagnosticato con EXPLAIN ANALYZE sul DB reale)
--   La ricerca catalogo genera "WHERE lower(name) LIKE '%q%'", ma l'unico indice
--   trigram era idx_games_name_trgm su `name` (non su lower(name)). Un indice su
--   `name` non copre un predicato su lower(name): risultato -> Seq Scan su tutte
--   le ~122k righe a ogni ricerca (~63 ms, 122.466 righe scartate dal filtro,
--   17.062 buffer letti). La controprova con "name ILIKE" aggancia l'indice e
--   scende a ~6,5 ms: l'indice e' sano, e' la lower() sulla colonna a escluderlo.
--
-- SOLUZIONE
--   Nuovo indice trigram GIN sull'ESPRESSIONE ESATTA usata dalla query,
--   lower(name), cosi' il pianificatore lo aggancia senza toccare il codice.
--   Il vecchio idx_games_name_trgm (su `name`) viene rimosso: l'applicazione
--   interroga sempre lower(name), quindi non lo usa mai, e mantenere due indici
--   GIN su name raddoppierebbe inutilmente il costo di scrittura degli import ETL.
--
-- NOTE
--   - lower(name) e' IMMUTABLE: ammesso in un indice su espressione.
--   - gin_trgm_ops supporta LIKE con wildcard iniziale ('%q%'): e' proprio il
--     caso della ricerca per sottostringa.
--   - pg_trgm gia' abilitata dalla baseline (V1).
--   - CREATE INDEX (non CONCURRENTLY) gira dentro la transazione di Flyway: sul
--     dataset del progetto e' un'operazione rapida.
--   - Forward-only: non modifica V1-V12.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Indice trigram sull'espressione usata dalla ricerca: lower(name)
-- -----------------------------------------------------------------------------

CREATE INDEX idx_games_name_lower_trgm ON games USING gin (lower(name) gin_trgm_ops);


-- -----------------------------------------------------------------------------
-- 2. Rimozione del vecchio indice mai agganciato dalla query (era su `name`)
-- -----------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_games_name_trgm;
