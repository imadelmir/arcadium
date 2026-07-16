-- =============================================================================
-- Arcadium — ACE5
-- Milestone M6 — Feature "Registro ore giocate (manuale, datato)"
-- Migrazione: tabella playtime_entry
--
-- Quindicesima migrazione versionata (V15), successiva a V14 (games_effective_price).
--
-- CONTESTO
--   Arcadium non traccia gli avvii reali dei giochi: il DB del catalogo e'
--   statico e non sappiamo QUANDO l'utente gioca. Per avere un grafico "ore per
--   mese" con dati veri (non finti), l'utente registra a mano quante ore ha
--   giocato e in che data. Ogni voce e' datata: da qui il grafico mensile vero
--   (SUM per mese) e il totale manuale (SUM su tutte le voci).
--
-- MODELLO
--   Una riga = una sessione dichiarata dall'utente: quanti minuti, in che giorno.
--   Sono ammesse piu' voci per stesso (utente, gioco, giorno): il grafico somma.
--   La voce esiste solo per un gioco gia' nel backlog dell'utente: FK COMPOSTA
--   verso backlog(user_id, app_id). Se il gioco esce dal backlog, le sue voci
--   spariscono (ON DELETE CASCADE).
--
-- RELAZIONE CON STEAM (M4-T16)
--   Il playtime da sync Steam vive su backlog.playtime_minutes ed e' la fonte
--   AUTORITATIVA del TOTALE quando l'account e' collegato ("Steam vince"). Questa
--   tabella resta comunque l'unica fonte possibile per la ripartizione MENSILE
--   (Steam espone solo il totale, non lo storico per mese).
--
-- NOTE
--   - PK surrogata (piu' voci per stesso giorno).
--   - minutes > 0 (una voce a zero non ha senso).
--   - played_on e' DATE (nessun orario, nessun fuso: il mese e' inequivocabile).
--   - Indice (user_id, played_on) per l'aggregazione mensile del grafico.
--   - Forward-only: non modifica V1-V14. Prerequisito: backlog (V1, M2-T4).
-- =============================================================================


CREATE TABLE playtime_entry (
    id          BIGINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT    NOT NULL,
    app_id      BIGINT    NOT NULL,
    minutes     INTEGER   NOT NULL,
    played_on   DATE      NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_playtime_entry_minutes CHECK (minutes > 0),

    -- La voce appartiene a un gioco effettivamente nel backlog dell'utente.
    -- Se la riga di backlog viene rimossa, le voci collegate cascano via.
    CONSTRAINT fk_playtime_entry_backlog
        FOREIGN KEY (user_id, app_id)
        REFERENCES backlog (user_id, app_id)
        ON DELETE CASCADE
);

-- Aggregazione mensile del grafico statistiche: WHERE user_id + GROUP BY mese.
CREATE INDEX idx_playtime_entry_user_month ON playtime_entry (user_id, played_on);


COMMENT ON TABLE  playtime_entry            IS 'Sessioni di gioco dichiarate manualmente dall''utente (minuti + data). Fonte del grafico ore/mese e del totale manuale. Il totale autoritativo passa a Steam quando l''account e'' collegato (M4-T16).';
COMMENT ON COLUMN playtime_entry.minutes    IS 'Durata dichiarata in minuti; > 0.';
COMMENT ON COLUMN playtime_entry.played_on  IS 'Giorno a cui la sessione e'' attribuita (DATE, senza orario/fuso): determina il mese nel grafico.';
