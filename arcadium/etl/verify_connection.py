"""
Verifica della connessione al database (M3-T5, pezzo 1).

Apre una connessione al PostgreSQL configurato in config/.env, legge la versione
del server e conta le tabelle del catalogo che l'ETL dovra' popolare. Non scrive
nulla: e' un controllo di prontezza prima del caricamento.

Uso (dalla cartella etl/):
    python verify_connection.py

Prerequisiti:
    - container Postgres avviato (scripts/: docker compose up -d db)
    - schema M2 applicato    (scripts/: docker compose --profile tools run --rm flyway migrate)
    - config/.env compilato  (DB_USER=arcadium, DB_PASSWORD=... come scripts/.env)
"""
from src.db.connection import check_connection


if __name__ == "__main__":
    ok = check_connection()
    raise SystemExit(0 if ok else 1)
