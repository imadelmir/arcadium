-- =============================================================================
-- V16 — Cambio username (storico + cooldown)
-- -----------------------------------------------------------------------------
-- Feature: l'utente puo' cambiare il proprio username, ma al massimo una volta
-- ogni 2 mesi; sul profilo pubblico resta visibile il nome precedente
-- ("potresti conoscerlo come @vecchio").
--
--   * previous_username   : ultimo username usato prima dell'ultimo cambio.
--                           NULL finche' l'utente non cambia mai nome. Non e'
--                           UNIQUE: e' un dato storico (un handle liberato puo'
--                           essere ripreso da altri).
--   * username_changed_at : istante dell'ultimo cambio, per far valere il
--                           cooldown di 2 mesi. NULL = mai cambiato.
-- =============================================================================

ALTER TABLE app_user
    ADD COLUMN previous_username   TEXT,
    ADD COLUMN username_changed_at TIMESTAMP;
