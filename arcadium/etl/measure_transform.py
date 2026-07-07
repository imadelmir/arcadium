"""
Misura del filtro di caricabilita' (M3-T3, pezzo 2).

Scorre l'intero dataset, applica il filtro e conta quanti giochi sarebbero
caricati e quanti scartati per ciascun motivo (app_id_null, name_missing, stub).
Mostra anche un gioco convertito di esempio, per verificare che le conversioni
scalari funzionino sul file reale.

Uso (dalla cartella etl/):
    python measure_transform.py                         # usa il file in data/ (.env)
    python measure_transform.py "C:\\percorso\\steam_games.json"
"""
import sys
from collections import Counter
from pathlib import Path

from config.settings import PathConfig
from src.extract.json_reader import read_games
from src.transform.filters import loadable_reason
from src.transform.game import build_game


def main() -> None:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else PathConfig.dataset_path()
    if not path.exists():
        print(f"File non trovato: {path}")
        return

    print(f"Lettura di: {path}\n")
    counts = Counter()
    sample = None

    for record in read_games(path):
        reason = loadable_reason(record)
        if reason:
            counts[reason] += 1
        else:
            counts["caricati"] += 1
            if sample is None:
                sample = build_game(record)

    total = sum(counts.values())
    print(f"Totale record        : {total:,}\n")
    print("Esito del filtro:")
    for key in ("caricati", "app_id_null", "name_missing", "stub"):
        n = counts.get(key, 0)
        perc = (n / total * 100) if total else 0
        print(f"  {key:<13}: {n:>8,}  ({perc:5.2f}%)")

    if sample is not None:
        print("\nEsempio di gioco convertito (campi scalari):")
        for k, v in sample.items():
            print(f"  {k:<24}: {v!r}")


if __name__ == "__main__":
    main()
