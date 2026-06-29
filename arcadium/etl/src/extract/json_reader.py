"""
Stadio EXTRACT: lettura in streaming del dataset Steam.

Il dataset e' un array JSON di record (un oggetto per gioco). Essendo ~500MB,
viene letto in streaming con ijson: i record vengono prodotti uno alla volta
(yield), senza caricare l'intero file in memoria.

L'extract e' volutamente "grezzo": restituisce i record cosi' come sono nel
file, senza pulizia ne' conversione di tipi. Quelle trasformazioni sono
compito dello stadio TRANSFORM (M3-T3).
"""
from pathlib import Path
from typing import Iterator

import ijson


def read_games(path: Path) -> Iterator[dict]:
    """
    Legge il dataset Steam e produce un record (dict) alla volta.

    Il file e' un array JSON; con il prefisso "item" ijson restituisce
    ogni elemento dell'array man mano che lo incontra nel file.

    Args:
        path: percorso del file JSON (array di record).

    Yields:
        dict: un gioco grezzo, con i campi (AppID, Name, ...) cosi' come
              sono nel file. L'AppID si trova dentro il record.
    """
    with open(path, "rb") as f:
        for record in ijson.items(f, "item"):
            yield record
