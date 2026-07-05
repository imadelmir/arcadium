"""
Stadio LOAD - Inserimenti idempotenti nel database (M3-T5).

Scrive nel database i dati preparati dagli stadi precedenti, in modo idempotente:
rieseguire l'ETL non crea duplicati ne' errori. Ogni INSERT sfrutta i vincoli
del modello M2 tramite ON CONFLICT, appoggiandosi ai vincoli reali dello schema:
  - lookup            -> ON CONFLICT (name)            (name UNIQUE)
  - games             -> ON CONFLICT (app_id)          (PK naturale)   DO UPDATE
  - tabelle ponte     -> ON CONFLICT (app_id, <lk>_id) (PK composta)   DO NOTHING
  - game_screenshot   -> ON CONFLICT (app_id, url)     (PK composta)   DO NOTHING

Questo file cresce pezzo per pezzo lungo M3-T5. Pezzi correnti:
  - upsert_lookups()       inserimento idempotente delle 6 lookup
  - load_lookup_id_maps()  rilettura delle mappe name -> id reale dal database
  - upsert_games()         inserimento/aggiornamento della riga games
  - upsert_screenshots()   inserimento degli screenshot (uno-a-molti)
  - upsert_bridges()       collegamenti game <-> lookup nelle 7 tabelle ponte
"""
from psycopg import sql

# Le sei lookup del catalogo. I nomi coincidono con Lookup.name del LookupCache
# (M3-T4) e con i nomi tabella dello schema M2 (02_lookup / baseline V1).
LOOKUP_TABLES = ("language", "developer", "publisher", "category", "genre", "tag")

# Le 30 colonne scalari di games, NELL'ORDINE dello schema M2 (baseline V1,
# 01_games). Coincidono con le chiavi scalari prodotte da build_game (M3-T3,
# dopo l'allineamento dei nomi a M1-T2). app_id e' la chiave: non si aggiorna.
GAMES_COLUMNS = (
    "app_id", "name", "release_date", "owners_min", "owners_max", "peak_ccu",
    "required_age", "price", "discount", "dlc_count", "about_the_game", "reviews",
    "header_image", "website", "support_url", "support_email", "windows", "mac",
    "linux", "metacritic_score", "metacritic_url", "positive", "negative",
    "achievements_count", "recommendations", "notes", "avg_playtime_forever",
    "avg_playtime_two_weeks", "median_playtime_forever", "median_playtime_two_weeks",
)


# ---------------------------------------------------------------------------
# Lookup (pezzo 2)
# ---------------------------------------------------------------------------

def upsert_lookups(conn, cache) -> None:
    """
    Inserisce i valori distinti delle sei lookup nel database, in modo idempotente.

    Per ogni registro del LookupCache prende i soli NOMI (gli id in memoria del
    cache NON vengono usati: le colonne id delle lookup sono GENERATED ALWAYS AS
    IDENTITY, quindi e' il database ad assegnare l'id). ON CONFLICT (name) DO
    NOTHING rende l'operazione ripetibile: i nomi gia' presenti vengono ignorati.

    Non fa commit: lo gestisce l'orchestratore (main.py) a fine passata.
    """
    with conn.cursor() as cur:
        for lookup in cache.all():
            names = [name for _mem_id, name in lookup.rows()]
            if not names:
                continue
            query = sql.SQL(
                "INSERT INTO {table} (name) VALUES (%s) "
                "ON CONFLICT (name) DO NOTHING"
            ).format(table=sql.Identifier(lookup.name))
            cur.executemany(query, [(n,) for n in names])


def load_lookup_id_maps(conn) -> dict:
    """
    Rilegge dal database, per ogni lookup, la mappa nome -> id REALE (id_db).

    Necessaria perche' gli id delle lookup li assegna il database (IDENTITY), non
    il LookupCache: gli id in memoria servivano solo alla deduplica logica. Queste
    mappe traducono i nomi puliti di ciascun gioco negli id da inserire nelle
    tabelle ponte (pezzo 4).

    Restituisce: { 'genre': {'Action': 12, ...}, 'developer': {...}, ... }
    """
    id_maps = {}
    with conn.cursor() as cur:
        for table in LOOKUP_TABLES:
            cur.execute(
                sql.SQL("SELECT name, id FROM {table}").format(
                    table=sql.Identifier(table)
                )
            )
            id_maps[table] = {name: db_id for name, db_id in cur.fetchall()}
    return id_maps


# ---------------------------------------------------------------------------
# Games e screenshot (pezzo 3)
# ---------------------------------------------------------------------------

# Query games costruita una volta sola (le colonne sono fisse). INSERT delle 30
# colonne; su conflitto di app_id aggiorna tutte le colonne tranne la chiave,
# prendendo i nuovi valori da EXCLUDED (la riga che si stava inserendo).
_UPDATE_COLUMNS = GAMES_COLUMNS[1:]  # tutte tranne app_id

_INSERT_GAMES = sql.SQL(
    "INSERT INTO games ({cols}) VALUES ({vals}) "
    "ON CONFLICT (app_id) DO UPDATE SET {assignments}"
).format(
    cols=sql.SQL(", ").join(sql.Identifier(c) for c in GAMES_COLUMNS),
    vals=sql.SQL(", ").join(sql.Placeholder() for _ in GAMES_COLUMNS),
    assignments=sql.SQL(", ").join(
        sql.SQL("{col} = EXCLUDED.{col}").format(col=sql.Identifier(c))
        for c in _UPDATE_COLUMNS
    ),
)

_INSERT_SCREENSHOT = sql.SQL(
    "INSERT INTO game_screenshot (app_id, url) VALUES (%s, %s) "
    "ON CONFLICT (app_id, url) DO NOTHING"
)


def upsert_games(conn, games) -> None:
    """
    Inserisce (o aggiorna) le righe della tabella games, in modo idempotente.

    'games' e' un iterabile di dizionari prodotti da build_game (M3-T3): si usano
    solo le 30 chiavi scalari (le liste multi-valore sono ignorate qui). Su
    conflitto di app_id, DO UPDATE riallinea la riga esistente ai valori del
    dataset corrente: rieseguire l'ETL con un dataset aggiornato aggiorna il
    catalogo, senza mai duplicare un gioco. Non fa commit.
    """
    rows = [tuple(g[col] for col in GAMES_COLUMNS) for g in games]
    if not rows:
        return
    with conn.cursor() as cur:
        cur.executemany(_INSERT_GAMES, rows)


def upsert_screenshots(conn, games) -> None:
    """
    Inserisce gli screenshot dei giochi (relazione uno-a-molti), idempotente.

    Un record per (app_id, url). ON CONFLICT (app_id, url) DO NOTHING evita i
    duplicati ai run successivi. Prerequisito: le righe games devono gia' esistere
    (FK app_id -> games), quindi si chiama dopo upsert_games. Non fa commit.
    """
    rows = [
        (g["app_id"], url)
        for g in games
        for url in g["screenshots"]
    ]
    if not rows:
        return
    with conn.cursor() as cur:
        cur.executemany(_INSERT_SCREENSHOT, rows)


# ---------------------------------------------------------------------------
# Tabelle ponte game <-> lookup (pezzo 4)
# ---------------------------------------------------------------------------

# Mappa: per ogni lista multi-valore del gioco, in quale ponte finisce, con quale
# colonna id, e da quale mappa lookup (id_maps) tradurre i nomi in id_db.
# Nota: 'languages' e 'audio_languages' sono liste distinte -> ponti distinti,
# ma condividono la STESSA lookup 'language' (una lingua ha un solo id_db, usato
# da entrambi i ponti). Coerente con l'unica tabella language del modello M1.
BRIDGES = (
    # (campo in build_game,  tabella ponte,          colonna id,     chiave lookup)
    ("languages",       "game_language",       "language_id",  "language"),
    ("audio_languages", "game_audio_language",  "language_id",  "language"),
    ("developers",      "game_developer",       "developer_id", "developer"),
    ("publishers",      "game_publisher",       "publisher_id", "publisher"),
    ("categories",      "game_category",        "category_id",  "category"),
    ("genres",          "game_genre",           "genre_id",     "genre"),
    ("tags",            "game_tag",             "tag_id",       "tag"),
)


def _bridge_query(table: str, id_col: str):
    """INSERT idempotente per una tabella ponte (PK composta app_id + id lookup)."""
    return sql.SQL(
        "INSERT INTO {table} (app_id, {idcol}) VALUES (%s, %s) "
        "ON CONFLICT (app_id, {idcol}) DO NOTHING"
    ).format(table=sql.Identifier(table), idcol=sql.Identifier(id_col))


# Query dei 7 ponti precompilate una volta sola.
_BRIDGE_SPECS = tuple(
    (field, _bridge_query(table, id_col), lookup_key)
    for field, table, id_col, lookup_key in BRIDGES
)


def upsert_bridges(conn, games, id_maps) -> None:
    """
    Collega ogni gioco alle sue lookup nelle 7 tabelle ponte, in modo idempotente.

    Per ogni associazione traduce i nomi puliti del gioco (es. g['genres']) negli
    id_db reali tramite id_maps (prodotta da load_lookup_id_maps) e inserisce le
    righe (app_id, <lookup>_id). ON CONFLICT (app_id, <lookup>_id) DO NOTHING evita
    i duplicati ai run successivi.

    Prerequisiti (FK): le righe games e le righe lookup devono gia' esistere, quindi
    si chiama dopo upsert_games e upsert_lookups, con id_maps gia' caricata.
    Non fa commit.
    """
    with conn.cursor() as cur:
        for field, query, lookup_key in _BRIDGE_SPECS:
            name_to_id = id_maps[lookup_key]
            rows = [
                (g["app_id"], name_to_id[name])
                for g in games
                for name in g[field]
            ]
            if rows:
                cur.executemany(query, rows)
