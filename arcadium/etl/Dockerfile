# =============================================================================
# Arcadium — ACE5 · Milestone M6 · Task T6
# Immagine della pipeline ETL (M3) come servizio "one-shot" della demo.
#
# Non e' un servizio sempre attivo: si lancia UNA volta per popolare il volume
# del database (docker compose --profile etl run --rm etl). Grazie al volume
# persistente di Postgres, i dati restano tra un `up` e l'altro: alla demo il
# catalogo e' gia' pieno senza rieseguire il caricamento.
#
# Il dataset (~460MB) NON e' nell'immagine: viene MONTATO da etl/data/ a
# runtime (bind mount nel compose). Le credenziali arrivano da variabili
# d'ambiente (config/settings.py le legge con os.getenv; load_dotenv non le
# sovrascrive, quindi le env del container hanno la precedenza).
# =============================================================================

FROM python:3.12-slim
WORKDIR /app

# psycopg[binary] include libpq: nessun toolchain di compilazione necessario.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Codice della pipeline (src/, config/, run_etl.py). data/ e logs/ sono montati.
COPY . .

# Avvio come da progetto: launcher dalla root di etl/ (qui /app).
CMD ["python", "run_etl.py"]
