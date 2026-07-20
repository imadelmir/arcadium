-- =============================================================================
-- V18 — Safe search: filtro contenuti per adulti nel Negozio
-- -----------------------------------------------------------------------------
-- Il catalogo Steam contiene titoli con contenuto sessuale esplicito, nudita' e
-- materiale per soli adulti. Sono classificati dal dataset (M1-T2) su tre
-- segnali gia' presenti a schema:
--
--   * genre.name  -> 'Sexual Content', 'Nudity', 'NSFW', 'Adult', ...
--   * tag.name    -> 'Hentai', 'Sexual Content', 'NSFW', 'Nudity', ...
--   * games.required_age >= 18
--
-- Questa colonna registra la SCELTA dell'utente, non un dato del catalogo:
--
--   * safe_search = TRUE  -> quei titoli NON compaiono nel Negozio (default);
--   * safe_search = FALSE -> il catalogo viene mostrato per intero.
--
-- Default TRUE (e NOT NULL) per due motivi: e' il comportamento atteso da chi
-- non ha mai aperto le impostazioni, ed e' l'unico default che non espone
-- contenuti espliciti agli account gia' esistenti al momento della migrazione.
-- Chi vuole vedere tutto lo dichiara esplicitamente dalle Impostazioni.
--
-- Il filtro e' applicato lato server (GameSpecifications): il client non puo'
-- aggirarlo forzando un query param, perche' il valore letto e' sempre quello
-- dell'utente autenticato.
--
-- Prerequisito: tabella app_user (schema/03_users.sql, M2-T3).
-- =============================================================================

ALTER TABLE app_user
    ADD COLUMN safe_search BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN app_user.safe_search IS 'Filtro contenuti per adulti nel Negozio (change request safe search). TRUE (default) = i giochi con generi/tag espliciti (Sexual Content, Nudity, NSFW, Hentai, ...) o con required_age >= 18 vengono esclusi dal catalogo; FALSE = catalogo completo. Applicato lato server in GameSpecifications, non aggirabile dal client.';
