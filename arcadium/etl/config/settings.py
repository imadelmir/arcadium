"""
Configurazione centralizzata della pipeline ETL.

Legge le variabili d'ambiente dal file `.env` (in questa stessa cartella) e le
espone in modo ordinato, cosi' il resto del codice non accede mai direttamente
a os.getenv. Se una variabile manca, viene usato un valore di default sensato.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Percorsi di base del progetto
CONFIG_DIR = Path(__file__).resolve().parent      # etl/config
ETL_DIR = CONFIG_DIR.parent                        # etl/

# Carica le variabili dal file .env (se presente)
load_dotenv(CONFIG_DIR / ".env")


class DatabaseConfig:
    """Parametri di connessione a PostgreSQL."""

    HOST = os.getenv("DB_HOST", "localhost")
    PORT = int(os.getenv("DB_PORT", "5432"))
    NAME = os.getenv("DB_NAME", "arcadium")
    USER = os.getenv("DB_USER", "postgres")
    PASSWORD = os.getenv("DB_PASSWORD", "")

    @classmethod
    def dsn(cls) -> str:
        """Stringa di connessione (DSN) nel formato accettato da psycopg2."""
        return (
            f"host={cls.HOST} port={cls.PORT} dbname={cls.NAME} "
            f"user={cls.USER} password={cls.PASSWORD}"
        )


class PathConfig:
    """Percorsi di input/output della pipeline."""

    DATA_DIR = ETL_DIR / "data"      # dataset di input (non versionato)
    LOGS_DIR = ETL_DIR / "logs"      # log e report (non versionati)

    # Nome del file dataset, sovrascrivibile da .env
    DATASET_FILE = os.getenv("DATASET_FILE", "steam_games.json")

    @classmethod
    def dataset_path(cls) -> Path:
        """Percorso completo del file dataset dentro etl/data/."""
        return cls.DATA_DIR / cls.DATASET_FILE
