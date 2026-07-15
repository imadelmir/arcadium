-- =============================================================================
-- Arcadium — ACE5
-- Milestone M6 — change request Community (sistema di amicizie)
-- Migrazione: tabella friendship
--
-- Decima migrazione versionata (V10), successiva a V9 (app_user.abandon_after_months).
--
-- CONTESTO
--   Change request: la pagina Community deve mostrare gli AMICI dell'utente e una
--   barra per cercarne di nuovi. L'amicizia e' su RICHIESTA + ACCETTAZIONE: A
--   invia una richiesta, B la accetta, e da quel momento sono amici (relazione
--   simmetrica). Finora non esisteva alcun concetto di amicizia nel progetto.
--
-- SOLUZIONE
--   Tabella friendship che rappresenta sia la richiesta sia l'amicizia:
--     - requester_id / addressee_id: chi invia e chi riceve (la direzione conta
--       solo finche' la richiesta e' 'pending', per sapere chi deve accettare);
--     - status: 'pending' (richiesta in attesa) oppure 'accepted' (amici);
--     - created_at: invio della richiesta;
--     - responded_at: momento dell'accettazione (NULL finche' pending).
--   Amicizia = riga con status 'accepted', indipendentemente dalla direzione:
--   "i miei amici" = righe accepted dove compaio come requester O addressee.
--
-- INTEGRITA'
--   - chk_friendship_not_self: non ci si aggiunge da soli.
--   - chk_friendship_status: dominio dello stato ristretto.
--   - uq_friendship_pair: UNA sola relazione per coppia in QUALSIASI direzione
--     (via LEAST/GREATEST, immutabili): niente richieste doppie ne' incrociate
--     A->B e B->A contemporaneamente.
--   - ON DELETE CASCADE: cancellato un utente, spariscono le sue amicizie.
--
-- NOTE
--   - Rifiuto di una richiesta o rimozione di un amico = DELETE della riga (non
--     teniamo storico dei rifiuti, fuori scope per il progetto).
--   - Un utente privato non e' cercabile (change request privacy), quindi non
--     puo' ricevere richieste tramite ricerca: coerente, nessun vincolo extra.
--   - Forward-only: non modifica V1-V9. Prerequisito: app_user (V1, M2-T3).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Tabella delle amicizie / richieste
-- -----------------------------------------------------------------------------

CREATE TABLE friendship (
    id            BIGINT     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    requester_id  BIGINT     NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,  -- chi invia la richiesta
    addressee_id  BIGINT     NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,  -- chi la riceve
    status        TEXT       NOT NULL DEFAULT 'pending',                          -- 'pending' | 'accepted'
    created_at    TIMESTAMP  NOT NULL DEFAULT now(),                              -- invio della richiesta
    responded_at  TIMESTAMP,                                                       -- accettazione (NULL se pending)

    CONSTRAINT chk_friendship_status   CHECK (status IN ('pending', 'accepted')),
    CONSTRAINT chk_friendship_not_self CHECK (requester_id <> addressee_id)
);


-- -----------------------------------------------------------------------------
-- 2. Una sola relazione per coppia, in qualsiasi direzione
--    (impedisce richieste doppie o incrociate A->B / B->A)
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX uq_friendship_pair
    ON friendship (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));


-- -----------------------------------------------------------------------------
-- 3. Indici di accesso: "richieste ricevute" e "miei amici"
-- -----------------------------------------------------------------------------

CREATE INDEX idx_friendship_addressee ON friendship (addressee_id, status);
CREATE INDEX idx_friendship_requester ON friendship (requester_id, status);


-- -----------------------------------------------------------------------------
-- 4. Commenti
-- -----------------------------------------------------------------------------

COMMENT ON TABLE  friendship               IS 'Amicizie tra utenti su richiesta+accettazione (change request Community). status=pending: richiesta in attesa; status=accepted: amici. Relazione simmetrica quando accepted.';
COMMENT ON COLUMN friendship.requester_id  IS 'Utente che ha inviato la richiesta di amicizia.';
COMMENT ON COLUMN friendship.addressee_id  IS 'Utente che ha ricevuto la richiesta (deve accettarla).';
COMMENT ON COLUMN friendship.status        IS 'Stato: ''pending'' (richiesta in attesa) o ''accepted'' (amici).';
COMMENT ON COLUMN friendship.responded_at  IS 'Istante di accettazione della richiesta; NULL finche'' pending.';
