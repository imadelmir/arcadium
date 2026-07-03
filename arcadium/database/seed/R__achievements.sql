-- =============================================================================
-- Arcadium — ACE5
-- Milestone M2 — Database PostgreSQL · Task T8 (seed)
-- Dati fissi del catalogo achievement: achievement
--
-- Migrazione RIPETIBILE Flyway (R__): rieseguita solo quando cambia il suo
-- contenuto, sempre dopo le migrazioni versionate (quindi dopo la creazione
-- della tabella achievement in V3__achievements.sql). Stessa convenzione di
-- R__backlog_status.sql (M2-T4/T6).
--
-- Definizioni di partenza del catalogo achievement (M1-T7 §5). Sistema
-- data-driven: ogni badge porta una metric e una threshold che il motore di
-- sblocco (M4-T11) confronta con le metriche derivate da backlog/wishlist
-- dell'utente. Estensibile: nuovi badge = nuove righe qui, senza modifiche di
-- schema. Metriche ammesse (M1-T7 §5): games_owned, games_finished,
-- games_abandoned, games_in_progress, playtime_hours, wishlist_size,
-- distinct_genres.
--
-- Etichette bilingui IT/EN (i18n). points: valore gamification indicativo e
-- regolabile. icon_url e is_active non impostati qui: NULL e TRUE per default.
--
-- Idempotente: ON CONFLICT (code) DO NOTHING (rieseguibile senza duplicati).
-- Prerequisito: tabella achievement creata (migrations/V3__achievements.sql).
-- =============================================================================

INSERT INTO achievement (code, metric, threshold, points, name_it, name_en, description_it, description_en) VALUES
    ('first_game',     'games_owned',     1,   10, 'Primo gioco',           'First game',     'Aggiungi il primo gioco alla libreria.',   'Add your first game to your library.'),
    ('collector_50',   'games_owned',     50,  50, 'Collezionista',         'Collector',      'Possiedi 50 giochi.',                      'Own 50 games.'),
    ('finisher_10',    'games_finished',  10,  30, 'Finalizzatore',         'Finisher',       'Completa 10 giochi.',                      'Complete 10 games.'),
    ('marathon_100h',  'playtime_hours',  100, 50, 'Maratoneta',            'Marathoner',     'Raggiungi 100 ore di gioco totali.',       'Reach 100 total hours played.'),
    ('genre_explorer', 'distinct_genres', 10,  30, 'Esploratore di generi', 'Genre Explorer', 'Possiedi giochi di 10 generi diversi.',    'Own games across 10 different genres.'),
    ('dreamer_20',     'wishlist_size',   20,  20, 'Sognatore',             'Dreamer',        'Aggiungi 20 giochi alla wishlist.',        'Add 20 games to your wishlist.')
ON CONFLICT (code) DO NOTHING;
