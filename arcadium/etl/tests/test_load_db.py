"""
Test di caricamento su un sottoinsieme, contro il database (M3-T7).

Richiedono PostgreSQL (database arcadium_test). Esclusi dalla corsa veloce:
lanciarli con  python -m pytest -m database
"""
import pytest

from src.transform.filters import loadable_reason
from src.transform.game import build_game
from src.load.lookup_cache import LookupCache
from src.load import inserter

pytestmark = pytest.mark.database


def _raw(app_id, name, **overrides):
    base = {
        "AppID": app_id, "Name": name, "Developers": "Valve", "Publishers": "Valve",
        "Genres": "Action", "Release date": "Jan 1, 2020",
        "Supported languages": "['English']", "Full audio languages": "[]",
        "Categories": "Single-player", "Tags": "FPS", "Screenshots": "",
    }
    base.update(overrides)
    return base


def _load(conn, records):
    """Esegue transform + load del subset, come fa la pipeline (M3-T5)."""
    games = [build_game(r) for r in records if loadable_reason(r) is None]
    cache = LookupCache()
    for g in games:
        cache.register_game(g)
    inserter.upsert_lookups(conn, cache)
    conn.commit()
    id_maps = inserter.load_lookup_id_maps(conn)
    inserter.upsert_games(conn, games)
    inserter.upsert_screenshots(conn, games)
    inserter.upsert_bridges(conn, games, id_maps)
    conn.commit()
    return games


def _count(conn, table):
    with conn.cursor() as cur:
        cur.execute(f"SELECT count(*) FROM {table}")
        return cur.fetchone()[0]


class TestSubsetLoad:
    def test_conteggi_dopo_caricamento(self, clean_db):
        records = [
            _raw(1, "Alpha", Genres="Action,Shooter"),
            _raw(2, "Beta", Genres="Action"),
            _raw(3, "Gamma", Developers="Supergiant", Publishers="Supergiant", Genres="Roguelike"),
        ]
        _load(clean_db, records)
        assert _count(clean_db, "games") == 3
        assert _count(clean_db, "genre") == 3       # Action, Shooter, Roguelike
        assert _count(clean_db, "developer") == 2   # Valve, Supergiant (dedup cross-game)

    def test_idempotenza_del_subset(self, clean_db):
        records = [_raw(1, "Alpha"), _raw(2, "Beta")]
        _load(clean_db, records)
        games1 = _count(clean_db, "games")
        bridge1 = _count(clean_db, "game_genre")
        _load(clean_db, records)  # secondo caricamento identico
        assert _count(clean_db, "games") == games1       # nessun duplicato
        assert _count(clean_db, "game_genre") == bridge1

    def test_i_record_non_caricabili_sono_esclusi(self, clean_db):
        records = [_raw(1, "Valido"), _raw(None, "SenzaID"), _raw(2, None)]
        games = _load(clean_db, records)
        assert len(games) == 1               # solo il primo passa il filtro
        assert _count(clean_db, "games") == 1

    def test_do_update_aggiorna_gioco_esistente(self, clean_db):
        _load(clean_db, [_raw(1, "Alpha")])
        _load(clean_db, [_raw(1, "Alpha rinominato")])  # stesso app_id, nome diverso
        with clean_db.cursor() as cur:
            cur.execute("SELECT name FROM games WHERE app_id = 1")
            assert cur.fetchone()[0] == "Alpha rinominato"
        assert _count(clean_db, "games") == 1  # aggiornato, non duplicato
