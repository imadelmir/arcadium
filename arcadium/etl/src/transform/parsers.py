"""
Stadio TRANSFORM - parsing dei campi multi-valore.

Due famiglie di formato, confermate sul file con inspect_fields.py:

  - LINGUE (Supported / Full audio languages): lista Python in stringa con apici
    singoli, es. "['English']" oppure '[]'. Non e' JSON valido: si usa
    ast.literal_eval.

  - VIRGOLA (Categories, Genres, Tags, Screenshots, Developers, Publishers):
    stringa separata da virgola, es. "Adventure,Visual Novel".

In entrambi i casi: strip degli spazi, scarto dei valori vuoti e deduplica
DENTRO lo stesso gioco, mantenendo l'ordine di apparizione. La deduplica TRA
giochi diversi (un solo 'Action' condiviso da migliaia di giochi) e' invece
compito del LookupCache (M3-T4).

Nota su Developers/Publishers: qui lo split sulla virgola e' "ingenuo" e puo'
produrre frammenti come 'Inc.' da nomi tipo 'Studio, Inc.'. La pulizia di questi
due campi e' demandata al pezzo 4 (supporto LLM), come previsto da M1-T2.
"""
import ast


def _dedup_keep_order(values):
    """Rimuove i doppioni mantenendo l'ordine della prima apparizione."""
    seen = set()
    result = []
    for v in values:
        if v not in seen:
            seen.add(v)
            result.append(v)
    return result


def parse_language_list(value):
    """Campo lingue ("['English']" / '[]' / null) -> lista di stringhe pulita."""
    if value is None:
        return []
    s = str(value).strip()
    if not s or s == "[]":
        return []
    try:
        parsed = ast.literal_eval(s)
    except (ValueError, SyntaxError):
        return []
    if not isinstance(parsed, list):
        return []
    cleaned = [str(x).strip() for x in parsed if str(x).strip()]
    return _dedup_keep_order(cleaned)


def parse_comma_list(value):
    """Campo separato da virgola ("Adventure,Visual Novel") -> lista di stringhe pulita."""
    if value is None:
        return []
    s = str(value).strip()
    if not s:
        return []
    cleaned = [p.strip() for p in s.split(",") if p.strip()]
    return _dedup_keep_order(cleaned)
