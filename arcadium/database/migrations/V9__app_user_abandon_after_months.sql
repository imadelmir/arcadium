-- =============================================================================
-- Arcadium — ACE5
-- Milestone M6 — QA & Delivery · change request (timeout auto-"Abbandonato")
-- Migrazione: preferenza utente app_user.abandon_after_months
--
-- Nona migrazione versionata (V9), successiva a V8 (games.name_starts_latin).
--
-- CONTESTO
--   Change request: nelle Impostazioni l'utente puo' scegliere un timeout dopo
--   il quale un gioco "In corso" passa automaticamente ad "Abbandonato" (solo
--   lo stato: il gioco resta in libreria). I valori ammessi sono 1, 3 o 6 mesi.
--
-- SOLUZIONE
--   Colonna abandon_after_months su app_user:
--     - SMALLINT, NULLABLE;
--     - NULL  -> funzione DISATTIVATA (default, opt-in): nessun auto-abbandono;
--     - 1/3/6 -> mesi di inattivita' oltre i quali scatta l'auto-abbandono.
--   Dominio ristretto da un CHECK a {NULL, 1, 3, 6}, coerente con le uniche
--   scelte offerte dall'interfaccia.
--
-- COME VIENE USATA (lato applicazione, non in questa migrazione)
--   Un job schedulato giornaliero sposta ad "Abbandonato" le voci di backlog in
--   stato "in_corso" per cui COALESCE(started_at, added_at) e' piu' vecchio di
--   abandon_after_months mesi, per i soli utenti con la colonna valorizzata.
--   Nessun dato viene rimosso: cambia solo status_id.
--
-- NOTE
--   - Default NULL: gli utenti esistenti restano con la funzione spenta, nessun
--     gioco viene abbandonato a sorpresa dopo l'aggiornamento.
--   - Forward-only: non modifica V1-V8 (una migrazione applicata non si riscrive
--     mai; si corregge in avanti). La colonna si aggiunge con ALTER TABLE.
--   - Prerequisito: app_user creata dalla baseline (V1__baseline_schema.sql,
--     M2-T3) ed estesa in V2 (M2-T7).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Colonna della preferenza di auto-abbandono su app_user
-- -----------------------------------------------------------------------------

ALTER TABLE app_user
    ADD COLUMN abandon_after_months SMALLINT;  -- NULL = auto-abbandono disattivato (opt-in)


-- -----------------------------------------------------------------------------
-- 2. Vincolo di dominio: solo i valori offerti dall'interfaccia
-- -----------------------------------------------------------------------------

ALTER TABLE app_user
    ADD CONSTRAINT chk_app_user_abandon_after_months
        CHECK (abandon_after_months IS NULL OR abandon_after_months IN (1, 3, 6));


-- -----------------------------------------------------------------------------
-- 3. Commento
-- -----------------------------------------------------------------------------

COMMENT ON COLUMN app_user.abandon_after_months IS 'Timeout di auto-abbandono scelto dall''utente (change request): NULL = disattivato (default, opt-in); 1, 3 o 6 = mesi di inattivita'' oltre i quali un gioco "In corso" passa automaticamente ad "Abbandonato" (solo lo stato, il gioco resta in libreria). Applicato da un job schedulato giornaliero su COALESCE(started_at, added_at).';
