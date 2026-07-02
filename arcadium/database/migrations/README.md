# Versioning dello schema — Arcadium (M2-T6)

Questa cartella contiene la **storia versionata e forward-only** dello schema
PostgreSQL. È la copia *eseguibile* dello schema: applicata in ordine, ricostruisce
il database da zero in modo riproducibile. I file annotati in `database/schema/`
restano la copia *di riferimento per concern* (leggibile, con la tracciabilità
ER → DDL dei documenti M1); questa cartella è ciò che gira contro un database.

## Strumento: Flyway

Lo schema è versionato con **Flyway**, con migrazioni in **SQL puro**.

- **Ora (M2/M3):** il database va creato prima dell'ETL Python (M3). Le migrazioni
  si applicano con `scripts/db-migrate.sh`, senza dipendere dall'app backend.
- **Poi (M4):** il backend Spring Boot integra `flyway-core` ed esegue le **stesse**
  migrazioni automaticamente all'avvio. La history (`flyway_schema_history`) è
  condivisa: nessuna migrazione viene rieseguita, nessun doppione.

Flyway è la scelta naturale perché è lo standard di fatto di Spring Boot (M4 lo
ottiene senza costi aggiuntivi) e allo stesso tempo funziona da solo, con SQL
nativo PostgreSQL, già in M2/M3.

## Convenzioni di naming

| Prefisso | Tipo | Quando gira | Esempio |
| --- | --- | --- | --- |
| `V<n>__<descrizione>.sql` | Versionata | una sola volta, in ordine di `<n>` | `V1__baseline_schema.sql` |
| `R__<descrizione>.sql` | Ripetibile (seed) | dopo le `V`, quando cambia il checksum | `R__backlog_status.sql` (in `database/seed/`) |

Doppio underscore `__` tra versione e descrizione; descrizione in `snake_case`.

## Regole

1. **Forward-only.** Non si torna indietro con migrazioni di *undo*: si corregge
   sempre in avanti con una nuova `V`.
2. **Una migrazione applicata non si modifica mai.** Flyway ne registra il
   checksum; cambiarla rompe la validazione. Per correggere, si aggiunge una
   nuova migrazione.
3. **Un cambiamento logico per file**, con header che cita il task e i § del
   modello (coerente con lo stile dei file di `schema/`).
4. **Seed idempotenti** (`ON CONFLICT DO NOTHING` o equivalenti): le `R__` possono
   rieseguire.

## Roadmap delle versioni

- `V1__baseline_schema.sql` — **baseline** (questo task, T6): le 19 tabelle del
  modello validato in M1-T6 (catalogo T1–T2, utenti/wishlist/backlog T3–T4),
  gli indici di T5 e l'estensione `pg_trgm`.
- `V2__user_integration_fields.sql` — campi utente `preferred_language`,
  `steam_id`, `discord_url`, `twitch_url` e `games.header_image` (**M2-T7**).
- `V3__achievements.sql` — `achievement`, `user_achievement` (**M2-T8**).
- `V4__future_ready_tables.sql` — `price_history`, `notification`,
  `notification_preference` (**M2-T9**).

I seed successivi (generi, lingue…) seguono la convenzione `R__*.sql` in
`database/seed/`.

## Applicare le migrazioni

```bash
export FLYWAY_PASSWORD='...'          # mai versionata
# opzionale: export FLYWAY_URL / FLYWAY_USER per ambienti diversi
scripts/db-migrate.sh info            # stato delle migrazioni
scripts/db-migrate.sh migrate         # applica quelle mancanti
```

Configurazione (url, user, locations, encoding) in `database/flyway.conf`.

### Handoff a M4 (Spring Boot)

In M4 basta puntare Flyway alle stesse cartelle, ad esempio in
`application.properties`:

```properties
spring.flyway.locations=filesystem:../database/migrations,filesystem:../database/seed
```

Poiché la history è la stessa, il backend riprende dallo stato lasciato da M2/M3.
