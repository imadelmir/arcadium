"""
Verifica della pulizia di developer/publisher (M3-T3, pezzo 4).

Confronta lo split "ingenuo" (prima) con la pulizia dei suffissi legali (dopo):
- conta i nomi distinti prima e dopo;
- verifica che i frammenti-spazzatura ('Inc.', 'LLC', 'Ltd.') siano spariti;
- mostra alcuni esempi reali di pulizia.

Uso (dalla cartella etl/):
    python verify_cleaning.py "C:\\percorso\\steam_games.json"
"""
import sys
from pathlib import Path

from config.settings import PathConfig
from src.extract.json_reader import read_games
from src.transform.parsers import parse_comma_list
from src.transform.cleaning import clean_company_list

JUNK = {"Inc.", "LLC", "Ltd.", "LTD.", "Ltd", "S.A.", "Co.", "GmbH"}


def main() -> None:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else PathConfig.dataset_path()
    if not path.exists():
        print(f"File non trovato: {path}")
        return

    print(f"Lettura di: {path}\n(qualche decina di secondi)")
    prima = {"dev": set(), "pub": set()}
    dopo = {"dev": set(), "pub": set()}
    esempi = []

    for record in read_games(path):
        for campo, key in (("Developers", "dev"), ("Publishers", "pub")):
            raw = record.get(campo)
            old = parse_comma_list(raw)
            new = clean_company_list(raw)
            prima[key].update(old)
            dopo[key].update(new)
            if len(esempi) < 8 and old != new and raw:
                esempi.append((raw[:70], old, new))

    for nome, key in (("DEVELOPERS", "dev"), ("PUBLISHERS", "pub")):
        p, d = len(prima[key]), len(dopo[key])
        print(f"\n{nome}: nomi distinti  prima {p:,}  ->  dopo {d:,}   (-{p - d:,})")
        residui = sorted(j for j in JUNK if j in dopo[key])
        print(f"  frammenti-spazzatura rimasti dopo la pulizia: {residui or 'nessuno'}")

    print("\nEsempi di pulizia:")
    for raw, old, new in esempi:
        print(f"  raw : {raw!r}")
        print(f"   prima: {old}")
        print(f"   dopo : {new}\n")


if __name__ == "__main__":
    main()
