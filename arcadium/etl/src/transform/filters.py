"""
Stadio TRANSFORM - filtro di caricabilita'.

Decide se un record grezzo va caricato nel database. Tre fasce:

  - app_id_null  : manca la chiave primaria (i 22 record senza AppID) -> scartato
  - name_missing : manca il nome -> scartato (un gioco senza nome non e'
                   ne' cercabile ne' mostrabile)
  - stub         : mancano TUTTI i campi-segnale (developer, publisher, genere,
                   data di rilascio) -> segnaposto vuoto, scartato

Tutto il resto e' caricabile, anche con qualche campo null (es. manca solo la
descrizione): quei null sono accettabili e non escludono il gioco.
"""
from .converters import clean_text

# Campi-segnale: se sono assenti TUTTI, il record e' un segnaposto vuoto.
SIGNAL_FIELDS = ("Developers", "Publishers", "Genres", "Release date")


def loadable_reason(record):
    """
    Ritorna None se il record e' caricabile, altrimenti il motivo dello scarto
    ('app_id_null', 'name_missing', 'stub').
    """
    if record.get("AppID") in (None, ""):
        return "app_id_null"

    if clean_text(record.get("Name")) is None:
        return "name_missing"

    if not any(clean_text(record.get(f)) for f in SIGNAL_FIELDS):
        return "stub"

    return None
