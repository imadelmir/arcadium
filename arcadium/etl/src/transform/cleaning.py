"""
Stadio TRANSFORM - pulizia dei nomi di developer e publisher (M3-T3, pezzo 4).

Lo split sulla virgola dei campi Developers/Publishers stacca per errore i
suffissi legali dai nomi (es. "Studio, Inc." -> ["Studio", "Inc."]) e lascia i
suffissi attaccati ("PlayWay S.A."). Questo modulo rimuove i suffissi legali,
sia staccati sia attaccati, in modo che:

    "Studio, Inc."          -> ["Studio"]
    "PlayWay S.A."          -> ["PlayWay"]      (si unisce a un eventuale "PlayWay")
    "KOEI TECMO GAMES CO."  -> ["KOEI TECMO GAMES"]
    "Studio A,Studio B"     -> ["Studio A", "Studio B"]   (nessun suffisso: invariato)

IMPORTANTE - supporto LLM e scope:
La LISTA dei suffissi legali qui sotto e' stata costruita con il supporto di un
LLM in fase di SVILUPPO (strumento di supporto, come previsto dalla commessa).
A runtime l'ETL applica SOLO queste regole deterministiche: nessuna chiamata a
modelli, pipeline ripetibile.

Vengono rimossi solo veri designatori societari, MAI parole descrittive del nome
(Games, Studios, Entertainment, Interactive, Software, Digital, ...), per non
accorciare nomi reali come "Choice of Games" o "BFG Entertainment".
"""
from .parsers import parse_comma_list

# Suffissi legali in forma normalizzata (minuscolo, senza punti).
LEGAL_SUFFIXES = {
    # inglese / internazionale
    "inc", "llc", "llp", "ltd", "limited", "co", "corp", "plc", "lp",
    # tedesco
    "gmbh", "ag", "ug", "kg", "mbh",
    # francese
    "sarl", "sas", "sasu", "eurl", "sa",
    # italiano
    "srl", "spa", "snc",
    # spagnolo
    "sl", "slu",
    # nordici
    "ab", "oy", "oyj", "as", "aps", "asa",
    # benelux
    "bv", "nv",
    # est europa / russia
    "sro", "ooo",
    # asia
    "kk", "pte", "pvt", "sdn", "bhd", "ltda",
}


def _normalize_token(token: str) -> str:
    """Token confrontabile coi suffissi: minuscolo, senza punti, senza virgola finale."""
    return token.strip().lower().replace(".", "").rstrip(",")


def strip_legal_suffix(name: str) -> str:
    """
    Rimuove uno o piu' suffissi legali finali da un nome.
    "PlayWay S.A." -> "PlayWay";  "Inc." -> "" (poi scartato dal chiamante).
    """
    tokens = name.split()
    while tokens and _normalize_token(tokens[-1]) in LEGAL_SUFFIXES:
        tokens.pop()
    return " ".join(tokens).strip().rstrip(",").strip()


def clean_company_list(value):
    """
    Campo Developers/Publishers -> lista di nomi puliti, senza suffissi legali,
    deduplicata dentro il gioco (mantenendo l'ordine).
    """
    fragments = parse_comma_list(value)   # split su virgola + strip + dedup grezzo
    seen = set()
    result = []
    for frag in fragments:
        name = strip_legal_suffix(frag)
        if name and name not in seen:
            seen.add(name)
            result.append(name)
    return result
