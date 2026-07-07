"""
Stadio TRANSFORM - costruzione del record di un gioco.

Prende un record grezzo e produce un dizionario piatto: i campi scalari
convertiti (la riga della tabella 'games') piu' le liste dei campi multi-valore
(lingue, developer, publisher, categorie, generi, tag, screenshot), gia' pulite
e deduplicate dentro il gioco.

Campi scartati (non mappati): User score, Score rank, Movies.
"""
from .converters import (
    clean_text, to_int, to_bool, to_price, parse_date, split_owners,
)
from .parsers import parse_language_list, parse_comma_list
from .cleaning import clean_company_list


def build_game(record):
    """Costruisce il dizionario scalare di un gioco a partire dal record grezzo."""
    owners_min, owners_max = split_owners(record.get("Estimated owners"))

    return {
        "app_id": to_int(record.get("AppID")),
        "name": clean_text(record.get("Name")),
        "release_date": parse_date(record.get("Release date")),
        "owners_min": owners_min,
        "owners_max": owners_max,
        "peak_ccu": to_int(record.get("Peak CCU")),
        "required_age": to_int(record.get("Required age")),
        "price": to_price(record.get("Price")),
        "discount": to_int(record.get("Discount")),
        "dlc_count": to_int(record.get("DLC count")),
        "about_the_game": clean_text(record.get("About the game")),
        "reviews": clean_text(record.get("Reviews")),
        "header_image": clean_text(record.get("Header image")),
        "website": clean_text(record.get("Website")),
        "support_url": clean_text(record.get("Support url")),
        "support_email": clean_text(record.get("Support email")),
        "windows": to_bool(record.get("Windows")),
        "mac": to_bool(record.get("Mac")),
        "linux": to_bool(record.get("Linux")),
        "metacritic_score": to_int(record.get("Metacritic score")),
        "metacritic_url": clean_text(record.get("Metacritic url")),
        "positive": to_int(record.get("Positive")),
        "negative": to_int(record.get("Negative")),
        "achievements_count": to_int(record.get("Achievements")),
        "recommendations": to_int(record.get("Recommendations")),
        "notes": clean_text(record.get("Notes")),
        "avg_playtime_forever": to_int(record.get("Average playtime forever")),
        "avg_playtime_two_weeks": to_int(record.get("Average playtime two weeks")),
        "median_playtime_forever": to_int(record.get("Median playtime forever")),
        "median_playtime_two_weeks": to_int(record.get("Median playtime two weeks")),
        # --- campi multi-valore (pezzo 3) ---
        # liste pulite e deduplicate dentro il gioco; gli ID condivisi tra giochi
        # li assegnera' il LookupCache (T4)
        "languages": parse_language_list(record.get("Supported languages")),
        "audio_languages": parse_language_list(record.get("Full audio languages")),
        "developers": clean_company_list(record.get("Developers")),
        "publishers": clean_company_list(record.get("Publishers")),
        "categories": parse_comma_list(record.get("Categories")),
        "genres": parse_comma_list(record.get("Genres")),
        "tags": parse_comma_list(record.get("Tags")),
        "screenshots": parse_comma_list(record.get("Screenshots")),
    }
