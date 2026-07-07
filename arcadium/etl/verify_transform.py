"""
Verifica del transform completo (M3-T3, pezzo 3).

Trova il primo gioco caricabile con i campi multi-valore popolati e ne stampa
il record costruito da build_game: scalari + liste. Serve a confermare che il
parsing dei campi multi-valore funzioni sul file reale.

Uso (dalla cartella etl/):
    python verify_transform.py                          # usa il file in data/ (.env)
    python verify_transform.py "C:\\percorso\\steam_games.json"
"""
import sys
from pathlib import Path

from config.settings import PathConfig
from src.extract.json_reader import read_games
from src.transform.filters import loadable_reason
from src.transform.game import build_game

LISTE = ["languages", "audio_languages", "developers", "publishers",
         "categories", "genres", "tags", "screenshots"]


def main() -> None:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else PathConfig.dataset_path()
    if not path.exists():
        print(f"File non trovato: {path}")
        return

    for record in read_games(path):
        if (loadable_reason(record) is None
                and record.get("Genres") and record.get("Developers")
                and record.get("Categories")):
            g = build_game(record)
            print(f"Gioco: {g['name']}  (app_id={g['app_id']})\n")
            print("Campi multi-valore (liste pulite e deduplicate):")
            for k in LISTE:
                v = g.get(k)
                print(f"  {k:<16}: {v}")
            return

    print("Nessun gioco con i campi multi-valore popolati trovato.")


if __name__ == "__main__":
    main()
