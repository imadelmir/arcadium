"""
Verifica del LookupCache sul file reale (M3-T4).

Fa girare tutto il transform e registra ogni gioco nel LookupCache, poi conta
i valori distinti di ciascuna lookup e li confronta con i numeri attesi
dall'analisi M1-T1 (generi 33, categorie 58, tag 450, lingue ~127) e con i
conteggi dopo la pulizia di M3-T3 (developer ~75.042, publisher ~62.343).

Uso (dalla cartella etl/):
    python verify_lookup.py                              # usa il file in data/ (.env)
    python verify_lookup.py "C:\\percorso\\steam_games.json"
"""
import sys
from pathlib import Path

from config.settings import PathConfig
from src.extract.json_reader import read_games
from src.transform.filters import loadable_reason
from src.transform.game import build_game
from src.load.lookup_cache import LookupCache

ATTESI = {
    "genre": "33",
    "category": "58",
    "tag": "450",
    "language": "~127",
    "developer": "~75.042 (dopo pulizia T3)",
    "publisher": "~62.343 (dopo pulizia T3)",
}


def main() -> None:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else PathConfig.dataset_path()
    if not path.exists():
        print(f"File non trovato: {path}")
        return

    print(f"Lettura di: {path}\n(qualche decina di secondi)")
    cache = LookupCache()
    n = 0
    for record in read_games(path):
        if loadable_reason(record) is not None:
            continue
        cache.register_game(build_game(record))
        n += 1

    print(f"Giochi processati: {n:,}\n")
    print(f"{'lookup':<12}{'distinti':>12}   atteso")
    print("-" * 48)
    for lk in cache.all():
        print(f"{lk.name:<12}{len(lk):>12,}   {ATTESI.get(lk.name, '')}")


if __name__ == "__main__":
    main()
