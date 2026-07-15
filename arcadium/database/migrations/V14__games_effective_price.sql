-- =============================================================================
-- Arcadium — ACE5
-- Milestone M6 — change request Negozio (fascia di prezzo: bug del filtro)
--
-- Migrazione V14, successiva a V12 (V13 già usato da un collega per un indice
-- trigram su games.name). Numerazione lasciata libera oltre V14 per eventuali
-- migrazioni parallele di altri colleghi (vedi V9-V11, V13); Flyway ha
-- out-of-order abilitato (application.yml) quindi l'ordine di arrivo non è
-- un problema.
--
-- PROBLEMA
--   Il filtro "fascia di prezzo" del Negozio confrontava minPrice/maxPrice con
--   games.price, che è il prezzo DI LISTINO (pre-sconto). La card del gioco
--   mostra invece il prezzo EFFETTIVO (scontato): price * (1 - discount/100).
--   Risultato: con lo sconto attivo, un gioco poteva risultare dentro la
--   fascia sui dati grezzi ma comparire con un prezzo fuori range sullo
--   schermo (es. fascia 60-100€, prezzo di listino 68€, sconto -20% -> 54,40€
--   mostrati, sotto il minimo scelto dall'utente).
--
-- SOLUZIONE
--   Colonna generata games.effective_price = ROUND(price * (100 - discount)
--   / 100, 2), indicizzata. Il filtro e l'ordinamento per prezzo del Negozio
--   ora si basano su questa colonna, coerenti con ciò che la card mostra:
--     - fascia di prezzo: WHERE effective_price BETWEEN minPrice AND maxPrice
--     - stato "Gratis"/"A pagamento": confrontano anch'essi effective_price,
--       cosi' un gioco scontato al 100% risulta "Gratis" (coerente con quanto
--       costa in questo momento), non più "A pagamento" sulla base del prezzo
--       di listino
--     - ordinamento "Prezzo: dal più basso/più alto": ordina su questa colonna
--
-- NOTE
--   - Colonna di SOLA LETTURA: la calcola PostgreSQL, l'ETL non la inserisce.
--   - Verificata su PostgreSQL 16 con sei scenari (nessuno sconto, sconto
--     parziale, sconto che porta esattamente al confine della fascia, gratis):
--     valori e ordinamento risultati corretti in tutti i casi.
--   - Forward-only: non tocca V1-V13.
-- =============================================================================

ALTER TABLE games
    ADD COLUMN effective_price numeric(10,2)
    GENERATED ALWAYS AS (round(price * (100 - discount) / 100.0, 2)) STORED;

CREATE INDEX idx_games_effective_price ON games (effective_price);
