"""Test dei parser multi-valore (M3-T3 parsers.py)."""
from src.transform.parsers import parse_language_list, parse_comma_list


class TestParseLanguageList:
    def test_singola(self):
        assert parse_language_list("['English']") == ["English"]

    def test_multipla(self):
        assert parse_language_list("['English', 'French']") == ["English", "French"]

    def test_lista_vuota(self):
        assert parse_language_list("[]") == []

    def test_none(self):
        assert parse_language_list(None) == []

    def test_deduplica_mantieni_ordine(self):
        assert parse_language_list("['English', 'French', 'English']") == ["English", "French"]

    def test_malformato_ritorna_vuoto(self):
        assert parse_language_list("non una lista") == []


class TestParseCommaList:
    def test_split(self):
        assert parse_comma_list("Action,Adventure") == ["Action", "Adventure"]

    def test_toglie_spazi(self):
        assert parse_comma_list("Action, Adventure") == ["Action", "Adventure"]

    def test_deduplica_interna(self):
        assert parse_comma_list("Action,Adventure,Action") == ["Action", "Adventure"]

    def test_none(self):
        assert parse_comma_list(None) == []

    def test_vuoto(self):
        assert parse_comma_list("") == []
