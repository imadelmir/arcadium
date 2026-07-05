"""
Stadio LOAD - Connessione a PostgreSQL (M3-T5).

Punto unico da cui la pipeline apre una connessione al database. Isola il driver
(psycopg 3) dal resto del codice: se un domani il driver cambia, si tocca solo
questo file. I parametri di connessione arrivano da config/settings.py
(DatabaseConfig), che a sua volta li legge dal file .env.

Perche' psycopg 3 e non psycopg2:
    Il progetto gira su Python 3.14. Il driver e' incapsulato qui: 'connect()'
    restituisce una psycopg.Connection standard, quindi l'inserter (pezzi
    successivi di T5) non dipende dai dettagli del driver.

Uso tipico (nei pezzi successivi di T5):
    from src.db.connection import connect
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("...")
        conn.commit()
"""
import psycopg

from config.settings import DatabaseConfig


def connect() -> psycopg.Connection:
    """
    Apre e restituisce una connessione a PostgreSQL.

    Usa il DSN costruito da DatabaseConfig (host, porta, db, utente, password).
    La connessione NON e' in autocommit: gli inserimenti di T5 controllano
    esplicitamente commit/rollback a blocchi, per un caricamento idempotente e
    transazionale.
    """
    return psycopg.connect(DatabaseConfig.dsn())


def check_connection() -> bool:
    """
    Verifica che il database sia raggiungibile e lo schema sia presente.

    Non scrive nulla: apre una connessione, legge la versione del server e conta
    le tabelle del catalogo che l'ETL dovra' popolare (games + lookup + ponte +
    screenshot = 15). Restituisce True se la connessione riesce, False altrimenti.
    Serve come primo controllo prima del caricamento vero e proprio.
    """
    catalog_tables = (
        "games", "language", "developer", "publisher", "category", "genre", "tag",
        "game_language", "game_audio_language", "game_developer", "game_publisher",
        "game_category", "game_genre", "game_tag", "game_screenshot",
    )
    try:
        with connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                version = cur.fetchone()[0]

                cur.execute(
                    "SELECT count(*) FROM pg_tables "
                    "WHERE schemaname = 'public' AND tablename = ANY(%s);",
                    (list(catalog_tables),),
                )
                found = cur.fetchone()[0]
    except psycopg.OperationalError as exc:
        print("Connessione fallita.")
        print(f"  Destinazione : {DatabaseConfig.NAME}@{DatabaseConfig.HOST}:{DatabaseConfig.PORT}")
        print(f"  Utente       : {DatabaseConfig.USER}")
        print(f"  Errore       : {str(exc).strip()}")
        print("\nControlla che il container Postgres sia avviato e che config/.env "
              "abbia host, porta, db, utente e password corretti.")
        return False

    print("Connessione riuscita.")
    print(f"  Destinazione : {DatabaseConfig.NAME}@{DatabaseConfig.HOST}:{DatabaseConfig.PORT}")
    print(f"  Utente       : {DatabaseConfig.USER}")
    print(f"  Server       : {version.split(' on ')[0]}")
    print(f"  Tabelle catalogo trovate : {found}/15")
    if found < 15:
        print("  ATTENZIONE: mancano tabelle di catalogo. Le migrazioni M2 "
              "(Flyway) sono state applicate al database?")
    return found == 15
