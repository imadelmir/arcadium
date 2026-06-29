# ETL Arcadium

Pipeline Python per il popolamento del database PostgreSQL a partire dallo
**Steam Games Dataset** (~500 MB JSON, 122.501 giochi).

La pipeline e' organizzata nei tre stadi classici dell'ETL:

```
src/
├── main.py        Entry point: orchestra i tre stadi
├── extract/       Lettura e parsing del dataset Steam        (M3-T2)
├── transform/     Pulizia e normalizzazione dei campi        (M3-T3)
├── load/          LookupCache e inserimenti nel database      (M3-T4, M3-T5)
└── db/            Connessione e utility per PostgreSQL
config/
├── .env.example   Template delle credenziali
└── settings.py    Legge la configurazione dal file .env
data/              Dataset di input (non versionato)
logs/              Log e report di caricamento (non versionati)
tests/             Test su subset e full load
```

## Setup

1. Creare un ambiente virtuale e installare le dipendenze:

   ```bash
   python -m venv .venv
   source .venv/bin/activate        # Linux / macOS
   .venv\Scripts\activate           # Windows
   pip install -r requirements.txt
   ```

2. Creare il file di configurazione a partire dal template e inserire le
   credenziali reali del database:

   ```bash
   cp config/.env.example config/.env
   ```

3. Posizionare il dataset Steam (JSON) dentro `data/`. La cartella e' ignorata
   da git: il file va condiviso tramite Google Drive / OneDrive.

## Esecuzione

Dalla cartella `etl/`:

```bash
python -m src.main
```

Allo stato attuale (M3-T1) il comando stampa solo la configurazione caricata,
come verifica che il setup sia corretto. Gli stadi extract/transform/load
verranno implementati nelle task successive (M3-T2 ... M3-T5).
