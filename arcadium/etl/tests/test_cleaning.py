"""Test della pulizia dei suffissi legali di developer/publisher (M3-T3 cleaning.py)."""
from src.transform.cleaning import strip_legal_suffix, clean_company_list


class TestStripLegalSuffix:
    def test_suffisso_attaccato(self):
        assert strip_legal_suffix("PlayWay S.A.") == "PlayWay"

    def test_suffisso_co(self):
        assert strip_legal_suffix("KOEI TECMO GAMES CO.") == "KOEI TECMO GAMES"

    def test_solo_suffisso_diventa_vuoto(self):
        assert strip_legal_suffix("Inc.") == ""

    def test_nessun_suffisso(self):
        assert strip_legal_suffix("Devolver Digital") == "Devolver Digital"

    # I nomi-parola NON devono essere tagliati
    def test_games_parola_preservata(self):
        assert strip_legal_suffix("Choice of Games") == "Choice of Games"

    def test_entertainment_preservata(self):
        assert strip_legal_suffix("BFG Entertainment") == "BFG Entertainment"


class TestCleanCompanyList:
    def test_suffisso_staccato_dalla_virgola(self):
        assert clean_company_list("CD Projekt Red, Inc.") == ["CD Projekt Red"]

    def test_due_developer_veri(self):
        assert clean_company_list("Studio A,Studio B") == ["Studio A", "Studio B"]

    def test_fusione_dopo_pulizia(self):
        assert clean_company_list("PlayWay S.A.,PlayWay") == ["PlayWay"]

    def test_none(self):
        assert clean_company_list(None) == []
