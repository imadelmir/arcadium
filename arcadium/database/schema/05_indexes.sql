-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T5
-- Indici, vincoli di integrita' e chiavi esterne
--
-- Chiavi primarie, chiavi esterne e vincoli di dominio (CHECK) sono gia'
-- applicati inline nei file delle rispettive tabelle (M2-T1..T4), essendo
-- parte inscindibile della definizione:
--   - games          -> PK app_id, CHECK discount/price/owners/required_age  (01_games.sql)
--   - lookup/ponte    -> id/name UNIQUE, PK composte, FK ON DELETE CASCADE    (02_lookup.sql)
--   - app_user        -> PK id, username/email UNIQUE                        (03_users.sql)
--   - wishlist/backlog-> PK (user_id, app_id), FK, playtime >= 0, RESTRICT    (04_wishlist_backlog.sql)
-- Questo task NON li riscrive: li da' per acquisiti e si concentra sugli
-- indici che li rendono efficienti (in particolare gli indici a supporto
-- delle FK, che PostgreSQL non crea in automatico).
--
-- Perimetro di questo task: indici per ricerca, filtri e integrita' referenziale
-- sulle diciannove tabelle del modello validato in M1 (T6): catalogo (T1-T2) e
-- parte dinamica utenti/wishlist/backlog (T3-T4).
--   - indici di achievement / user_achievement                     -> M2-T8
--   - indici di notification / notification_preference / price_history -> M2-T9
-- entrambi rinviati perche' quelle tabelle vengono create dopo questo task.
--
-- Prerequisito: tabelle di M2-T1..T4 gia' create.
-- Nota ETL (M3): al carico massivo (~122k giochi) questi indici sono
-- accettabili; eventuali indici analitici aggiuntivi si valutano dopo profiling.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Estensione per la ricerca testuale
--    pg_trgm abilita gli indici GIN a trigrammi per la ricerca per sottostringa
--    (ILIKE '%...%') su nome gioco e display_name utente.
--    Puo' essere spostata nel setup di migrazione (M2-T6): qui e' idempotente.
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- -----------------------------------------------------------------------------
-- 1. Catalogo: ricerca e filtri sui giochi (requisito "ricerca sui giochi")
--    La PK app_id copre gia' l'accesso per chiave. Qui si indicizzano le
--    colonne usate dalla ricerca testuale e dai filtri/ordinamenti del catalogo.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_games_name_trgm     ON games USING gin (name gin_trgm_ops);  -- ricerca catalogo per sottostringa (ILIKE)
CREATE INDEX idx_games_name          ON games (name);                          -- ordinamento alfabetico / ricerca per prefisso
CREATE INDEX idx_games_release_date  ON games (release_date);                  -- filtro/ordinamento "novita'", per anno
CREATE INDEX idx_games_price         ON games (price);                         -- filtro per fascia di prezzo / gratis
CREATE INDEX idx_games_metacritic    ON games (metacritic_score);             -- ordinamento per voto Metacritic

-- Candidati ulteriori (peak_ccu, positive, recommendations) rinviati: si
-- aggiungono solo se il profiling delle query di M4/M5 ne mostra il bisogno.


-- -----------------------------------------------------------------------------
-- 2. Tabelle ponte: indici a supporto delle FK (direzione lookup -> games)
--    La PK composta (app_id, <lookup>_id) indicizza gia' la direzione
--    games -> lookup e la cancellazione a cascata di un gioco. Serve invece un
--    indice sulla SECONDA colonna per:
--      a) le query di filtro del catalogo ("tutti i giochi con genere/tag X");
--      b) l'ON DELETE CASCADE quando si elimina una riga di lookup.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_game_language_language        ON game_language (language_id);
CREATE INDEX idx_game_audio_language_language  ON game_audio_language (language_id);
CREATE INDEX idx_game_developer_developer      ON game_developer (developer_id);
CREATE INDEX idx_game_publisher_publisher      ON game_publisher (publisher_id);
CREATE INDEX idx_game_category_category        ON game_category (category_id);
CREATE INDEX idx_game_genre_genre              ON game_genre (genre_id);
CREATE INDEX idx_game_tag_tag                  ON game_tag (tag_id);

-- game_screenshot: nessun indice aggiuntivo. La PK (app_id, url) ha app_id come
-- prima colonna e copre l'unico accesso previsto (screenshot per gioco).


-- -----------------------------------------------------------------------------
-- 3. Utenti: ricerca (requisito "ricerca sugli utenti")
--    username ed email sono gia' indicizzati dai vincoli UNIQUE (03_users.sql);
--    steam_id UNIQUE (M2-T7) lo sara' analogamente. Resta da coprire
--    display_name, usato nella ricerca utenti.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_app_user_display_name_trgm ON app_user USING gin (display_name gin_trgm_ops);  -- ricerca utenti per display_name


-- -----------------------------------------------------------------------------
-- 4. Wishlist e backlog: indici a supporto delle FK e dei filtri
--    La PK (user_id, app_id) copre gia' l'accesso per utente (user_id prima
--    colonna) e la cascata dall'utente. Servono gli indici sulle altre FK.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_wishlist_app_id    ON wishlist (app_id);      -- FK -> games (cascade) + "chi ha in wishlist questo gioco"

CREATE INDEX idx_backlog_app_id     ON backlog (app_id);       -- FK -> games (cascade)
CREATE INDEX idx_backlog_status_id  ON backlog (status_id);    -- FK -> backlog_status (RESTRICT) + filtro/statistiche per stato
