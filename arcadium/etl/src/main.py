"""
Entry point della pipeline ETL di Arcadium (M3).

Orchestra i tre stadi sul dataset Steam:
    EXTRACT   -> lettura in streaming del JSON        (M3-T2, src/extract/)
    TRANSFORM -> pulizia e normalizzazione dei campi  (M3-T3, src/transform/)
    LOAD      -> LookupCache e inserimenti nel DB      (M3-T4, M3-T5, src/load/)

Il caricamento e' organizzato in DUE PASSATE sul file, per tenere la memoria
costante (i ~122k giochi non stanno mai tutti in RAM insieme):

  Passata 1 - LOOKUP
    Scorre il file, costruisce il LookupCache (raccoglie i valori distinti di
    generi, categorie, tag, lingue, developer, publisher), poi inserisce le sei
    lookup nel database e rilegge le mappe nome -> id_db reali. Necessario prima
    dei giochi e delle ponti (le ponti hanno FK verso le lookup).

  Passata 2 - CATALOGO
    Ri-scorre il file a blocchi (BATCH_SIZE giochi): per ogni blocco inserisce
    le righe games, gli screenshot e i collegamenti nelle 7 tabelle ponte, con
    un commit a fine blocco. Cosi' la transazione resta piccola e ripartibile.

Tutti gli inserimenti sono idempotenti (M3-T5): rieseguire l'ETL non crea
duplicati; i giochi gia' presenti vengono aggiornati (games ON CONFLICT DO
UPDATE), il resto ignorato (ON CONFLICT DO NOTHING).

Uso (dalla cartella etl/):
    python -m src.main                       # dataset da config/.env (data/)
    python -m src.main "C:\\percorso\\steam_games.json"
"""
import sys
import time
from pathlib import Path

from config.settings import DatabaseConfig, PathConfig
from src.extract.json_reader import read_games
from src.transform.filters import loadable_reason
from src.transform.game import build_game
from src.load.lookup_cache import LookupCache
from src.db.connection import connect
from src.load import inserter

# Numero di giochi per blocco di commit nella passata 2. Compromesso tra
# velocita' (poche transazioni) e granularita' (ripartenza in caso di stop).
BATCH_SIZE = 5000


def _iter_loadable(path: Path):
    """Genera i giochi costruiti (build_game) saltando i record non caricabili."""
    for record in read_games(path):
        if loadable_reason(record) is None:
            yield build_game(record)


def build_lookup_cache(path: Path):
    """Passata 1: registra i valori multi-valore di ogni gioco nel LookupCache."""
    cache = LookupCache()
    n_loadable = 0
    for game in _iter_loadable(path):
        cache.register_game(game)
        n_loadable += 1
    return cache, n_loadable


def _flush(conn, games, id_maps) -> None:
    """Scrive un blocco di giochi: games, screenshot, ponti; poi commit."""
    inserter.upsert_games(conn, games)
    inserter.upsert_screenshots(conn, games)
    inserter.upsert_bridges(conn, games, id_maps)
    conn.commit()


def load_catalog(conn, path: Path, id_maps: dict) -> int:
    """Passata 2: carica games/screenshot/ponti a blocchi di BATCH_SIZE."""
    batch = []
    total = 0
    for game in _iter_loadable(path):
        batch.append(game)
        if len(batch) >= BATCH_SIZE:
            _flush(conn, batch, id_maps)
            total += len(batch)
            batch = []
            print(f"      ... {total:,} giochi")
    if batch:
        _flush(conn, batch, id_maps)
        total += len(batch)
    return total


def run(dataset: str | None = None) -> int:
    """Esegue la pipeline ETL end-to-end. Ritorna 0 se ok, 1 in caso di errore."""
    path = Path(dataset) if dataset else PathConfig.dataset_path()
    if not path.exists():
        print(f"Dataset non trovato: {path}")
        print("Metti il file in etl/data/ o passa il percorso come argomento.")
        return 1

    print(f"=== ETL Arcadium -> {DatabaseConfig.NAME}@{DatabaseConfig.HOST}:{DatabaseConfig.PORT} ===")
    print(f"Dataset: {path}\n")
    t0 = time.time()

    with connect() as conn:
        # ---- Passata 1: lookup ----
        print("[1/2] Costruzione lookup (deduplica dei valori ripetuti)...")
        cache, n_loadable = build_lookup_cache(path)
        inserter.upsert_lookups(conn, cache)
        conn.commit()
        id_maps = inserter.load_lookup_id_maps(conn)
        for lk in cache.all():
            print(f"      {lk.name:<11}: {len(lk):>7,} valori distinti")

        # ---- Passata 2: catalogo ----
        print(f"\n[2/2] Caricamento catalogo ({n_loadable:,} giochi, blocchi da {BATCH_SIZE:,})...")
        total = load_catalog(conn, path, id_maps)

    dt = time.time() - t0
    print(f"\nCompletato: {total:,} giochi caricati in {dt:.1f}s.")
    return 0


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    raise SystemExit(run(arg))
