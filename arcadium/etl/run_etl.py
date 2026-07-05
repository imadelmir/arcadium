"""
Avvio della pipeline ETL (M3).

Launcher da eseguire dalla cartella etl/, come gli altri script del progetto
(measure_transform.py, verify_*.py):

    python run_etl.py
    python run_etl.py "C:\\percorso\\steam_games.json"

Tutta la logica e' in src/main.py; questo file la avvia. Eseguire come script
dalla root di etl/ e' il metodo di avvio gia' usato nel progetto ed evita le
differenze di risoluzione dei package che si hanno con 'python -m src.main'.
"""
import sys

from src.main import run

if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    raise SystemExit(run(arg))
