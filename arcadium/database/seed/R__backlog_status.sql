-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T6 (seed)
-- Dati fissi degli stati del backlog: backlog_status
--
-- Migrazione RIPETIBILE Flyway (R__): rieseguita solo quando cambia il suo
-- contenuto, sempre dopo le migrazioni versionate (quindi dopo la creazione di
-- backlog_status in V1). Rinomina di database/seed/01_backlog_status.sql
-- (M2-T4) alla convenzione di versioning introdotta in M2-T6.
--
-- I quattro stati definiti in T5 §4: oltre ai tre della commessa si aggiunge
-- 'mai_giocato', stato di default all'aggiunta di un gioco posseduto (libreria
-- sincronizzata da Steam con tempo di gioco nullo). code stabile (usato dal
-- servizio), etichette bilingui per l'interfaccia, sort_order per l'ordinamento UI.
--
-- Idempotente: ON CONFLICT (code) DO NOTHING (rieseguibile senza duplicati).
-- Prerequisito: tabella backlog_status creata (migrations/V1__baseline_schema.sql).
-- =============================================================================

INSERT INTO backlog_status (code, label_it, label_en, sort_order) VALUES
    ('mai_giocato', 'Mai giocato', 'Never played', 1),
    ('in_corso',    'In corso',    'Playing',      2),
    ('finito',      'Finito',      'Completed',    3),
    ('abbandonato', 'Abbandonato', 'Abandoned',    4)
ON CONFLICT (code) DO NOTHING;
