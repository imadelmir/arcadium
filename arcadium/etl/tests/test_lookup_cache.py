"""Test del LookupCache (M3-T4 lookup_cache.py): deduplica cross-game e id stabili."""
from src.load.lookup_cache import Lookup, LookupCache


def _game(languages=None, audio_languages=None, developers=None, publishers=None,
          categories=None, genres=None, tags=None):
    return {
        "languages": languages or [], "audio_languages": audio_languages or [],
        "developers": developers or [], "publishers": publishers or [],
        "categories": categories or [], "genres": genres or [], "tags": tags or [],
    }


class TestLookup:
    def test_id_progressivi(self):
        lk = Lookup("genre")
        assert lk.get_id("Action") == 1
        assert lk.get_id("RPG") == 2
        assert lk.get_id("Indie") == 3

    def test_id_stabile_per_stesso_valore(self):
        lk = Lookup("genre")
        primo = lk.get_id("Action")
        lk.get_id("RPG")
        assert lk.get_id("Action") == primo  # non cambia

    def test_len_conta_i_distinti(self):
        lk = Lookup("genre")
        lk.get_id("Action")
        lk.get_id("Action")  # ripetuto: non aumenta
        lk.get_id("RPG")
        assert len(lk) == 2

    def test_rows_coppie_id_nome(self):
        lk = Lookup("genre")
        lk.get_id("Action")
        lk.get_id("RPG")
        assert lk.rows() == [(1, "Action"), (2, "RPG")]


class TestLookupCache:
    def test_sei_registri(self):
        cache = LookupCache()
        nomi = [lk.name for lk in cache.all()]
        assert nomi == ["language", "developer", "publisher",
                        "category", "genre", "tag"]

    def test_register_game_ritorna_le_sette_liste(self):
        cache = LookupCache()
        ids = cache.register_game(_game(genres=["Action"], developers=["Valve"]))
        assert set(ids.keys()) == {
            "language_ids", "audio_language_ids", "developer_ids", "publisher_ids",
            "category_ids", "genre_ids", "tag_ids",
        }

    def test_deduplica_cross_game(self):
        # 'Action' in tre giochi diversi -> un solo id nel registro genre
        cache = LookupCache()
        cache.register_game(_game(genres=["Action", "Shooter"]))
        cache.register_game(_game(genres=["Action"]))
        cache.register_game(_game(genres=["Action", "RPG"]))
        assert len(cache.genre) == 3  # Action, Shooter, RPG
        # e tutti e tre i giochi puntano allo stesso id per 'Action'
        assert cache.genre.get_id("Action") == 1

    def test_developer_condiviso_tra_giochi(self):
        cache = LookupCache()
        cache.register_game(_game(developers=["Valve"]))
        cache.register_game(_game(developers=["Valve"]))
        assert len(cache.developer) == 1

    def test_language_condiviso_tra_supportate_e_audio(self):
        # 'English' come lingua supportata E audio: un solo id nel registro language
        cache = LookupCache()
        ids = cache.register_game(_game(languages=["English", "French"],
                                        audio_languages=["English"]))
        assert len(cache.language) == 2  # English, French
        # l'id di English e' lo stesso in supportate e audio
        english_id = cache.language.get_id("English")
        assert english_id in ids["language_ids"]
        assert ids["audio_language_ids"] == [english_id]
