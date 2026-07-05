"""
Fixture condivise per i test che usano il database (M3-T7).

I test-DB girano su un database SEPARATO (arcadium_test), mai su quello di
produzione: la fixture 'clean_db' svuota le tabelle di catalogo prima e dopo
ogni test, quindi non va puntata sui dati veri. Host, porta, utente e password
sono riusati da DatabaseConfig (config/.env); cambia solo il nome del database,
sovrascrivibile con la variabile d'ambiente TEST_DB_NAME.
"""
import os

import psycopg
import pytest

from config.settings import DatabaseConfig

TEST_DB_NAME = os.getenv("TEST_DB_NAME", "arcadium_test")

# Tabelle di catalogo svuotate tra un test e l'altro (RESTART IDENTITY azzera
# anche le sequenze delle lookup, per conteggi id prevedibili).
_CATALOG = (
    "games", "language", "developer", "publisher", "category", "genre", "tag",
    "game_language", "game_audio_language", "game_developer", "game_publisher",
    "game_category", "game_genre", "game_tag", "game_screenshot",
)


def _test_dsn() -> str:
    return (f"host={DatabaseConfig.HOST} port={DatabaseConfig.PORT} "
            f"dbname={TEST_DB_NAME} user={DatabaseConfig.USER} "
            f"password={DatabaseConfig.PASSWORD}")


def _truncate_catalog(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(f"TRUNCATE {', '.join(_CATALOG)} RESTART IDENTITY CASCADE")
    conn.commit()


@pytest.fixture
def clean_db():
    """Connessione al database di test, con tabelle di catalogo svuotate."""
    try:
        conn = psycopg.connect(_test_dsn())
    except psycopg.OperationalError as exc:
        pytest.skip(f"database di test '{TEST_DB_NAME}' non raggiungibile: {exc}")
    _truncate_catalog(conn)
    yield conn
    _truncate_catalog(conn)
    conn.close()
