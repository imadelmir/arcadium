"""
Stadio TRANSFORM - convertitori di base.

Funzioni piccole e riusabili che convertono un valore grezzo (cosi' come arriva
dall'extract) nel tipo corretto per il database, gestendo null e valori vuoti.
Nota: ijson restituisce i numeri come Decimal, quindi i convertitori accettano
anche Decimal oltre a int/float/str.
"""
from datetime import datetime
from decimal import Decimal, InvalidOperation


def clean_text(value):
    """Stringa ripulita dagli spazi, oppure None se vuota o null."""
    if value is None:
        return None
    s = str(value).strip()
    return s if s else None


def to_int(value):
    """Intero, oppure None se null/vuoto/non convertibile."""
    if value is None or value == "":
        return None
    try:
        return int(value)                 # gestisce int, Decimal, stringhe numeriche
    except (ValueError, TypeError):
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None


def to_bool(value):
    """Booleano, oppure None. Accetta sia bool reali sia stringhe 'True'/'False'."""
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return value
    s = str(value).strip().lower()
    if s in ("true", "1", "yes"):
        return True
    if s in ("false", "0", "no"):
        return False
    return None


def to_price(value):
    """Numero decimale (per Price, Discount), oppure None. Usa Decimal per il denaro."""
    if value is None or value == "":
        return None
    if isinstance(value, Decimal):
        return value
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


# Formati di data accettati per 'Release date' (es. "Aug 1, 2023", "Aug 2023")
_DATE_FORMATS = ("%b %d, %Y", "%b %Y", "%Y")


def parse_date(value):
    """Converte la data di rilascio in un oggetto date, oppure None se non interpretabile."""
    s = clean_text(value)
    if s is None:
        return None
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None  # es. "Coming soon", "To be announced", formati ignoti


def split_owners(value):
    """'0 - 20000' -> (0, 20000). Ritorna (min, max), oppure (None, None)."""
    s = clean_text(value)
    if s is None:
        return (None, None)
    parts = s.split("-")
    if len(parts) != 2:
        return (None, None)
    return (to_int(parts[0]), to_int(parts[1]))
