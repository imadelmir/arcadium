"""Test del filtro di caricabilita' (M3-T3 filters.py): app_id_null / name_missing / stub."""
from src.transform.filters import loadable_reason


def _record(**overrides):
    base = {
        "AppID": 10, "Name": "Un Gioco", "Developers": "Valve",
        "Publishers": "Valve", "Genres": "Action", "Release date": "Jan 1, 2020",
    }
    base.update(overrides)
    return base


class TestLoadable:
    def test_record_completo_caricabile(self):
        assert loadable_reason(_record()) is None

    def test_manca_solo_descrizione_ok(self):
        # un campo non-segnale assente non esclude il gioco
        assert loadable_reason(_record(Reviews=None)) is None


class TestScarti:
    def test_app_id_none(self):
        assert loadable_reason(_record(AppID=None)) == "app_id_null"

    def test_app_id_stringa_vuota(self):
        assert loadable_reason(_record(AppID="")) == "app_id_null"

    def test_nome_mancante(self):
        assert loadable_reason(_record(Name=None)) == "name_missing"

    def test_nome_vuoto(self):
        assert loadable_reason(_record(Name="   ")) == "name_missing"

    def test_stub_tutti_i_segnali_assenti(self):
        rec = _record(Developers=None, Publishers=None, Genres=None)
        rec["Release date"] = None
        assert loadable_reason(rec) == "stub"

    def test_un_solo_segnale_salva_dallo_stub(self):
        # bastano developer presenti: non e' stub
        rec = _record(Publishers=None, Genres=None)
        rec["Release date"] = None
        assert loadable_reason(rec) is None
