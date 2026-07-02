-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T4 (seed)
-- Dati fissi degli stati del backlog: backlog_status
--
-- I quattro stati definiti in T5 §4: al di la' dei tre della commessa si
-- aggiunge 'mai_giocato', stato di default all'aggiunta di un gioco posseduto
-- (libreria sincronizzata da Steam con tempo di gioco nullo).
-- code stabile (usato dal servizio), etichette bilingui per l'interfaccia,
-- sort_order per l'ordinamento UI.
--
-- Idempotente: ON CONFLICT (code) DO NOTHING (rieseguibile senza duplicati).
-- Prerequisito: tabella backlog_status creata (schema/04_wishlist_backlog.sql).
-- =============================================================================

INSERT INTO backlog_status (code, label_it, label_en, sort_order) VALUES
    ('mai_giocato', 'Mai giocato', 'Never played', 1),
    ('in_corso',    'In corso',    'Playing',      2),
    ('finito',      'Finito',      'Completed',    3),
    ('abbandonato', 'Abbandonato', 'Abandoned',    4)
ON CONFLICT (code) DO NOTHING;
