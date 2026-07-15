# Arcadium — Ambiente demo (M6 - T6)

Stack a tre container (db + backend + frontend) piu' un servizio ETL one-shot
per il caricamento iniziale del catalogo. Un solo comando per la demo.

## Prerequisiti
- Docker Desktop attivo.
- Dataset ETL presente in `etl/data/steam_games.json` (non versionato).

## Preparazione (una volta, es. da casa)

    cp .env.demo.example .env         # imposta DB_PASSWORD e JWT_SECRET
    docker compose --profile etl run --rm etl   # popola il DB (~qualche minuto)

Il caricamento e' idempotente e scrive i dati nel volume `arcadium-pgdata`, che
persiste tra un avvio e l'altro. Va rifatto solo se il volume viene distrutto
(`docker compose down -v`).

## Avvio della demo

    docker compose up -d --build

- Frontend: http://localhost:3000
- Backend / Swagger: http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/actuator/health

## Stop

    docker compose down        # ferma tutto, i dati restano nel volume
    docker compose down -v     # ferma e CANCELLA anche i dati (poi ri-seed)

## Note
- Lo schema (Flyway V1..V7 + seed R__) viene applicato dal backend all'avvio su
  DB nuovo: nessun `flyway repair` manuale, la history parte pulita.
- `PASSWORD_RESET_EXPOSE_TOKEN=true` e' attivo SOLO per la demo (nessun server
  email): il token di reset torna nella risposta dell'API.
- `NEXT_PUBLIC_API_URL` e' incorporato nel frontend a build time e usato dal
  browser: per una demo su un'altra macchina impostalo nel `.env` e ricostruisci
  il frontend (`docker compose up -d --build frontend`).
