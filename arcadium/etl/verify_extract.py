"""
Verifica rapida dello stadio EXTRACT (M3-T2).

Legge l'intero dataset con read_games(), conta i record e mostra il primo,
per confermare che il parsing in streaming funzioni sul file reale e che il
file si legga dall'inizio alla fine senza errori.

Uso (dalla cartella etl/):
    python verify_extract.py                          # usa il file in data/ (.env)
    python verify_extract.py "C:\\percorso\\steam_games.json"
"""
import sys
import time
from pathlib import Path

from config.settings import PathConfig
from src.extract.json_reader import read_games


def main() -> None:
    # Percorso: argomento da riga di comando, altrimenti quello configurato in .env
    if len(sys.argv) > 1:
        path = Path(sys.argv[1])
    else:
        path = PathConfig.dataset_path()

    if not path.exists():
        print(f"File non trovato: {path}")
        print("Passa il percorso come argomento, oppure metti il file in etl/data/.")
        return

    print(f"Lettura di: {path}")
    print("(su ~500MB puo' richiedere qualche decina di secondi)\n")
    start = time.time()

    total = 0
    first = None
    for record in read_games(path):
        if total == 0:
            first = record
        total += 1

    elapsed = time.time() - start

    print(f"Record letti     : {total:,}")
    print(f"Tempo di lettura : {elapsed:.1f}s")

    if first is not None:
        print(f"\nCampi nel 1o record : {len(first)}")
        print(f"AppID               : {first.get('AppID')}")
        print(f"Name                : {first.get('Name')}")
        print("\nElenco dei campi del 1o record:")
        for key in first.keys():
            print(f"  - {key}")


if __name__ == "__main__":
    main()
