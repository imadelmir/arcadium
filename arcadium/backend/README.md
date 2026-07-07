# Backend — Arcadium (M4)

Backend REST della piattaforma Arcadium, in **Spring Boot 4.1** (Java 21).
Questa cartella nasce in **M4-T1**: scheletro del progetto e connessione a
PostgreSQL. Entita', autenticazione ed endpoint arrivano nei task successivi.

## Prerequisiti

- **JDK 21**
- **Maven 3.9+**
- Il database PostgreSQL locale avviato e migrato (M2/M3):

  ```bash
  cd scripts
  docker compose up -d db                                   # avvia Postgres 16
  docker compose --profile tools run --rm flyway migrate    # applica lo schema
  ```

## Configurazione

Le credenziali si passano da variabili d'ambiente (stesse chiavi dell'ETL).
Copiare il template e valorizzarlo, oppure esportarle nell'ambiente:

```bash
cp .env.example .env    # poi impostare DB_PASSWORD
```

| Variabile | Default | Descrizione |
| --- | --- | --- |
| `DB_HOST` | `localhost` | Host PostgreSQL |
| `DB_PORT` | `5432` | Porta |
| `DB_NAME` | `arcadium` | Nome database |
| `DB_USER` | `arcadium` | Utente |
| `DB_PASSWORD` | — | Password (mai versionata) |
| `SERVER_PORT` | `8080` | Porta HTTP del backend |

## Avvio

Dalla cartella `backend/`:

```bash
DB_PASSWORD=ACE_5 mvn spring-boot:run
```

All'avvio l'app apre il pool verso PostgreSQL, Flyway **valida** la history
condivisa contro le migrazioni M2/M3 (senza rieseguirle) e viene stampato un
riepilogo di connessione (versione server, tabelle di catalogo trovate).

Verifica esterna:

```bash
curl http://localhost:8080/actuator/health
# {"status":"UP", ... "db":{"status":"UP", ...}}
```

## Struttura

```
backend/
├─ pom.xml                     Dipendenze (BOM Spring Boot) e build
├─ .env.example               Template credenziali (DB_*, SERVER_PORT)
└─ src/
   ├─ main/
   │  ├─ java/com/ace5/arcadium/
   │  │  ├─ ArcadiumApplication.java     Entry point
   │  │  └─ config/                       Verifica connessione all'avvio
   │  └─ resources/
   │     └─ application.yml               Datasource, JPA, Flyway, actuator
   └─ test/
      └─ java/com/ace5/arcadium/          Smoke test del contesto
```

I package `controller/`, `service/`, `repository/`, `entity/`, `dto/`,
`security/`, `exception/` e `resources/messages/` vengono introdotti dai task
successivi di M4 (T2 in poi), man mano che se ne implementa il contenuto.

## Migrazioni dello schema

Il backend **non** possiede uno schema proprio: riusa le **stesse** migrazioni
di `database/` (V\_\_ in `migrations/`, R\_\_ in `seed/`) tramite `flyway-core`,
condividendo la tabella `flyway_schema_history`. Nessuna migrazione viene
riscritta o duplicata qui. Dettagli e regole in `database/README.md`.
