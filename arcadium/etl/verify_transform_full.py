"""
Verifica finale end-to-end dello stadio TRANSFORM (M3-T3).

Scorre l'intero file, applica il filtro e costruisce il record di ogni gioco
caricabile con build_game, intercettando eventuali errori. Conferma che il
transform giri sull'intero dataset senza eccezioni e riporta due statistiche
aggregate di controllo.

Uso (dalla cartella etl/):
    python verify_transform_full.py "C:\\percorso\\steam_games.json"
"""
import sys
import time
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

    print(f"Lettura di: {path}\n(qualche decina di secondi)")
    start = time.time()

    ok = 0
    errori = 0
    senza_developer = 0
    with_release = 0

    for record in read_games(path):
        if loadable_reason(record) is not None:
            continue
        try:
            g = build_game(record)
        except Exception as exc:  # non deve accadere: segnala il record problematico
            errori += 1
            if errori <= 5:
                print(f"  ERRORE su AppID {record.get('AppID')}: {exc}")
            continue
        ok += 1
        if not g["developers"]:
            senza_developer += 1
        if g["release_date"] is not None:
            with_release += 1

    elapsed = time.time() - start
    print(f"\nGiochi trasformati senza errori : {ok:,}")
    print(f"Errori                          : {errori}")
    print(f"Tempo                           : {elapsed:.1f}s")
    print(f"\nControlli aggregati:")
    print(f"  giochi con data di rilascio valida : {with_release:,}")
    print(f"  giochi senza developer             : {senza_developer:,}")


if __name__ == "__main__":
    main()
