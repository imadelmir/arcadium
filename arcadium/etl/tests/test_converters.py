"""Test dei convertitori di tipo scalari (M3-T3 converters.py)."""
from src.transform.converters import clean_text, to_int, to_bool, split_owners


class TestCleanText:
    def test_none_resta_none(self):
        assert clean_text(None) is None

    def test_toglie_spazi(self):
        assert clean_text("  Hello  ") == "Hello"

    def test_stringa_vuota_diventa_none(self):
        assert clean_text("") is None

    def test_solo_spazi_diventa_none(self):
        assert clean_text("   ") is None


class TestToInt:
    def test_none(self):
        assert to_int(None) is None

    def test_intero(self):
        assert to_int(42) == 42

    def test_stringa_numerica(self):
        assert to_int("42") == 42

    def test_non_numerico_diventa_none(self):
        assert to_int("abc") is None


class TestToBool:
    def test_true(self):
        assert to_bool("True") is True

    def test_false(self):
        assert to_bool("False") is False


class TestSplitOwners:
    def test_intervallo(self):
        lo, hi = split_owners("0 - 20000")
        assert lo == 0
        assert hi == 20000
