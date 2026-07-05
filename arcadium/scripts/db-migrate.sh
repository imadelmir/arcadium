#!/usr/bin/env bash
# =============================================================================
# Arcadium — ACE5 · Milestone M2 · Task T6
# Applica le migrazioni dello schema (migrations/V__*.sql) e i seed ripetibili
# (seed/R__*.sql) al database PostgreSQL, tramite Flyway.
#
# Usato in M2/M3 prima che esista l'app Spring Boot (M4). In M4 le STESSE
# migrazioni vengono eseguite automaticamente all'avvio dal flyway-core di
# Spring Boot: la history (flyway_schema_history) e' condivisa, senza doppioni.
#
# Connessione via env (default in database/flyway.conf):
#   FLYWAY_URL       default jdbc:postgresql://localhost:5432/arcadium
#   FLYWAY_USER      default arcadium
#   FLYWAY_PASSWORD  obbligatoria, mai versionata
#
# Uso:  scripts/db-migrate.sh [migrate|info|validate]   (default: migrate)
# =============================================================================
set -euo pipefail

DB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../database" && pwd)"
CMD="${1:-migrate}"
: "${FLYWAY_PASSWORD:?Imposta FLYWAY_PASSWORD (password del DB, non versionata)}"

if command -v flyway >/dev/null 2>&1; then
  exec flyway -configFiles="$DB_DIR/flyway.conf" \
              -locations="filesystem:$DB_DIR/migrations,filesystem:$DB_DIR/seed" \
              "$CMD"
elif command -v docker >/dev/null 2>&1; then
  exec docker run --rm --network=host \
       -v "$DB_DIR:/flyway/project" \
       -e FLYWAY_PASSWORD -e FLYWAY_URL -e FLYWAY_USER \
       flyway/flyway:10 \
       -configFiles=/flyway/project/flyway.conf \
       -locations=filesystem:/flyway/project/migrations,filesystem:/flyway/project/seed \
       "$CMD"
else
  echo "Flyway non trovato (ne' binario 'flyway' ne' 'docker')." >&2
  echo "Installa la Flyway CLI, oppure applica manualmente in ordine:" >&2
  echo "  psql \"\$FLYWAY_URL\" -f database/migrations/V1__baseline_schema.sql" >&2
  echo "  psql \"\$FLYWAY_URL\" -f database/seed/R__backlog_status.sql" >&2
  exit 1
fi
