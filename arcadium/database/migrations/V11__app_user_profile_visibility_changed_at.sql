-- =============================================================================
-- Arcadium — ACE5
-- Milestone M6 — change request Privacy (cooldown cambio visibilita')
-- Migrazione: app_user.profile_visibility_changed_at
--
-- Undicesima migrazione versionata (V11), successiva a V10 (friendship).
--
-- CONTESTO
--   Change request: dopo che l'utente imposta la visibilita' del profilo
--   (pubblico/privato), deve attendere 48 ORE prima di poterla cambiare di nuovo.
--
-- SOLUZIONE
--   Colonna profile_visibility_changed_at che registra l'istante dell'ULTIMO
--   cambio di is_profile_public:
--     - NULL  -> visibilita' mai cambiata: nessun cooldown, cambio consentito;
--     - valorizzata -> il backend blocca un nuovo cambio finche' non sono
--       passate 48h da questo istante.
--   La colonna si aggiorna SOLO quando la visibilita' cambia davvero (non ai
--   salvataggi che lasciano lo stesso valore). Regola applicata dal backend.
--
-- NOTE
--   - NULLABLE, nessun default: gli utenti esistenti partono senza cooldown
--     (possono cambiare una volta subito, poi scatta l'attesa).
--   - Distinta da updated_at (che cambia a ogni update della riga): qui conta
--     solo il cambio di visibilita'.
--   - Forward-only: non modifica V1-V10. Prerequisito: app_user (V1, M2-T3).
-- =============================================================================


ALTER TABLE app_user
    ADD COLUMN profile_visibility_changed_at TIMESTAMP;  -- NULL = mai cambiata (nessun cooldown)


COMMENT ON COLUMN app_user.profile_visibility_changed_at IS 'Istante dell''ultimo cambio di is_profile_public (change request): NULL = mai cambiata. Il backend vieta un nuovo cambio finche'' non sono trascorse 48 ore da questo istante.';
