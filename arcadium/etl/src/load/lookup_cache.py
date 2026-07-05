"""
Stadio LOAD - LookupCache (M3-T4).

Le liste di nomi prodotte dal transform (generi, categorie, tag, lingue,
developer, publisher) contengono valori che si ripetono tra migliaia di giochi:
'Action' compare in moltissimi giochi. Nel database ogni valore deve esistere
UNA sola volta, con un proprio id, e i giochi lo riusano tramite le tabelle
ponte.

Il LookupCache e' un "registro" nome->id per ciascun tipo di lookup. Mentre si
scorrono i giochi, per ogni nome:
  - se e' gia' visto, restituisce l'id assegnato in precedenza;
  - se e' nuovo, gli assegna un nuovo id progressivo e lo memorizza.

Cosi' ogni nome distinto ottiene un solo id stabile (deduplica TRA giochi).
Gli id sono interi progressivi in memoria: il cache funziona senza database e
in T5 questi id diventano gli id veri delle tabelle lookup.

Nota: le lingue supportate e le lingue con audio condividono lo STESSO registro
'language' (un'unica tabella language nel modello). Gli screenshot NON passano di
qui: sono una relazione uno-a-molti (un url per gioco), non si deduplicano.
"""


class Lookup:
    """Registro nome->id per un singolo tipo di entita' lookup."""

    def __init__(self, name: str):
        self.name = name          # es. "genre", "developer"
        self._ids = {}            # nome -> id
        self._next_id = 1

    def get_id(self, value: str) -> int:
        """Restituisce l'id del nome, creandone uno nuovo se non ancora visto."""
        existing = self._ids.get(value)
        if existing is not None:
            return existing
        new_id = self._next_id
        self._ids[value] = new_id
        self._next_id += 1
        return new_id

    def rows(self):
        """Coppie (id, nome) di tutte le voci, in ordine di id."""
        return [(i, n) for n, i in self._ids.items()]

    def __len__(self):
        return len(self._ids)


class LookupCache:
    """Contiene i sei registri lookup del catalogo."""

    def __init__(self):
        self.language = Lookup("language")
        self.developer = Lookup("developer")
        self.publisher = Lookup("publisher")
        self.category = Lookup("category")
        self.genre = Lookup("genre")
        self.tag = Lookup("tag")

    def all(self):
        """I sei registri, per iterare o contare."""
        return [self.language, self.developer, self.publisher,
                self.category, self.genre, self.tag]

    def register_game(self, game: dict) -> dict:
        """
        Registra i valori multi-valore di un gioco nei registri e restituisce
        gli id dei collegamenti, pronti per le tabelle ponte (usati in T5).
        Le lingue supportate e audio usano entrambe il registro 'language'.
        """
        return {
            "language_ids": [self.language.get_id(v) for v in game["languages"]],
            "audio_language_ids": [self.language.get_id(v) for v in game["audio_languages"]],
            "developer_ids": [self.developer.get_id(v) for v in game["developers"]],
            "publisher_ids": [self.publisher.get_id(v) for v in game["publishers"]],
            "category_ids": [self.category.get_id(v) for v in game["categories"]],
            "genre_ids": [self.genre.get_id(v) for v in game["genres"]],
            "tag_ids": [self.tag.get_id(v) for v in game["tags"]],
        }
