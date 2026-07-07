# Arcadium ETL — Popolamento del database

Questa cartella contiene la **pipeline ETL** che legge il dataset Steam
(`steam_games.json`) e riempie il database PostgreSQL con il catalogo dei giochi.

Questa guida serve a chiunque debba **partire da zero** e ritrovarsi un database
popolato in locale (per esempio per lavorare al backend M4 o al frontend M5).
Segui i passi in ordine: in ~5 minuti hai il database pronto.

---

## Cosa fa la pipeline

In tre fasi (Extract → Transform → Load):

1. **Extract** — legge `steam_games.json` (~500 MB, 122.501 record).
2. **Transform** — pulisce e normalizza i dati (tipi, lingue, nomi dei
   developer/publisher) e scarta i record non validi (restano 122.479 giochi).
3. **Load** — scrive nel database PostgreSQL, in modo **idempotente**: puoi
   rilanciare l'ETL più volte senza creare duplicati.

Il risultato è il database `arcadium` pieno: 122.479 giochi più le tabelle di
lookup (generi, categorie, tag, lingue, developer, publisher), le tabelle di
collegamento e gli screenshot.

> **Nota importante:** il file `steam_games.json` è solo la *sorgente*. Una volta
> popolato il database, backend e frontend leggono **dal database**, non dal JSON.

---

## Prerequisiti

Prima di iniziare assicurati di avere:

- **Docker Desktop** installato e **avviato** (l'icona a forma di balena deve
  dire "Engine running").
- **Python 3.14** installato.
- Il file **`steam_games.json`** — non è nel repository (troppo grande). Chiedilo
  al team (è condiviso su Google Drive) e mettilo nella cartella `etl/data/`.

---

## Passi (la prima volta)

### 1. Metti il dataset al suo posto

Copia `steam_games.json` dentro `etl/data/`. Il percorso finale deve essere:

```
etl/data/steam_games.json
```

### 2. Avvia il database (container Docker)

I comandi del container si lanciano dalla cartella **`scripts/`**:

```bash
cd scripts
docker compose up -d db          # avvia PostgreSQL in background
docker compose ps                # controlla: deve dire "running (healthy)"
```

> Se `docker compose ps` non mostra il container o dà timeout, quasi sempre
> **Docker Desktop non è avviato**: aprilo e riprova.

### 3. Applica lo schema del database (migrazioni)

Sempre da `scripts/`, crea le tabelle con Flyway:

```bash
docker compose --profile tools run --rm flyway migrate
```

Devi vedere l'applicazione delle migrazioni `V1 ... V4` e dei seed con esito
`Success`. Questo passo si fa **una sola volta** (finché non azzeri il database).

### 4. Configura le credenziali dell'ETL

Vai nella cartella **`etl/`** e crea il file `.env` copiando il modello:

```bash
cd ../etl
Copy-Item config\.env.example config\.env      # su Windows (PowerShell)
# oppure, su Mac/Linux:   cp config/.env.example config/.env
```

Apri `config/.env` e verifica che **`DB_PASSWORD` sia identica** a
`POSTGRES_PASSWORD` nel file `scripts/.env`. Se non coincidono, la connessione
fallisce con "no password supplied" o "password authentication failed".

### 5. Installa le dipendenze Python

Sempre da `etl/`:

```bash
pip install -r requirements.txt
```

### 6. Controlla che il database sia raggiungibile

```bash
python verify_connection.py
```

Se leggi **"Connessione riuscita … 15/15"**, sei pronto. Se invece dà errore,
torna al passo 2 (container spento) o 4 (password nel `.env`).

### 7. Popola il database

```bash
python run_etl.py
```

La pipeline legge il file e carica il catalogo (impiega ~60-70 secondi).
Alla fine stampa un **report**: se vedi `games: 122.479` ed **esito
"completato senza errori"**, il database è popolato correttamente.

Ogni esecuzione lascia anche un log e un report nella cartella `logs/`.

---

## Test (facoltativo)

La pipeline ha una suite di test automatici:

```bash
python -m pytest              # test rapidi (non richiedono il database)
```

Ci sono anche test che caricano dati su un database di prova (`arcadium_test`).
Per usarli, crea prima quel database (una tantum), poi lancia:

```bash
python -m pytest -m database  # test di caricamento su arcadium_test
```

---

## Problemi comuni

Ecco gli intoppi più frequenti (imparati sul campo):

- **`connection timeout` / `connection refused`** → il container è spento.
  Avvialo da `scripts/` con `docker compose up -d db` e aspetta che sia `healthy`.
- **`no password supplied`** → manca il file `config/.env`, oppure la password
  non coincide con quella di `scripts/.env`.
- **`ModuleNotFoundError`** → stai lanciando dalla cartella sbagliata. L'ETL si
  avvia **sempre dalla cartella `etl/`** con `python run_etl.py`.
- **Comportamenti strani dopo aver aggiornato i file** → cancella le cache
  compilate: `Get-ChildItem -Path src -Recurse -Directory -Filter __pycache__ | Remove-Item -Recurse -Force`

---

## Spegnere e riaccendere

Per spegnere il database **senza perdere i dati**:

```bash
docker compose down          # da scripts/ — i dati restano nel volume
```

Per riaccenderlo, basta `docker compose up -d db`: i dati sono ancora lì, non
serve rifare le migrazioni né ripopolare.

> Attenzione: `docker compose down -v` (con `-v`) **cancella anche i dati**. In
> quel caso dovrai rifare i passi 3 e 7.

---

## Nota per la demo finale (M6)

Durante lo sviluppo ognuno usa il **proprio** database in locale (questa guida).
Per la demo al cliente, quando backend e frontend dovranno girare su un ambiente
comune, il team valuterà un **PostgreSQL condiviso** (es. un servizio gratuito
come Neon o Supabase): si popola una volta sola con questo stesso ETL e si
distribuisce la stringa di connessione. È una scelta da fare in fase di deploy,
non prima.
