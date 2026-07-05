"""
Configurazione del logging della pipeline ETL (M3-T6).

Fornisce un unico logger 'arcadium.etl' con doppio output:

  - CONSOLE : messaggi sintetici (livello INFO), come l'avanzamento a schermo.
  - FILE    : dettaglio completo con timestamp e livello (livello DEBUG), in
              logs/etl_<timestamp>.log — uno storico per ogni esecuzione.

Il resto della pipeline non configura nulla: chiede il logger con
logging.getLogger('arcadium.etl') dopo che main.py ha chiamato setup_logging().
La cartella logs/ (prevista in M3-T1, non versionata) viene creata se manca.
"""
import logging
from datetime import datetime
from pathlib import Path

from config.settings import PathConfig

LOGGER_NAME = "arcadium.etl"


def setup_logging(level_console: int = logging.INFO,
                  level_file: int = logging.DEBUG) -> tuple[logging.Logger, Path]:
    """
    Configura e restituisce il logger della pipeline e il percorso del file di log.

    Crea due handler: uno su console (messaggio essenziale) e uno su file dentro
    logs/, con nome che porta data e ora dell'esecuzione. Se il logger è già stato
    configurato (handler presenti), non li duplica: la funzione è ripetibile.

    Ritorna (logger, log_path).
    """
    PathConfig.LOGS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_path = PathConfig.LOGS_DIR / f"etl_{timestamp}.log"

    logger = logging.getLogger(LOGGER_NAME)
    logger.setLevel(logging.DEBUG)          # soglia minima; filtrano gli handler
    logger.propagate = False

    # Evita handler duplicati se setup_logging viene richiamato piu' volte.
    if logger.handlers:
        return logger, log_path

    console = logging.StreamHandler()
    console.setLevel(level_console)
    console.setFormatter(logging.Formatter("%(message)s"))

    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setLevel(level_file)
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s  %(levelname)-7s  %(message)s",
                          datefmt="%Y-%m-%d %H:%M:%S")
    )

    logger.addHandler(console)
    logger.addHandler(file_handler)
    return logger, log_path
