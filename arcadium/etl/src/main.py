"""
Entry point della pipeline ETL di Arcadium.

Orchestrazione dei tre stadi:
    EXTRACT   -> lettura e parsing del dataset Steam      (M3-T2, src/extract/)
    TRANSFORM -> pulizia e normalizzazione dei campi      (M3-T3, src/transform/)
    LOAD      -> LookupCache e inserimenti nel database   (M3-T4 e M3-T5, src/load/)

Stato attuale (M3-T1): solo scheletro. Eseguendo questo file la pipeline non
carica ancora dati, ma stampa la configurazione letta dal .env: serve come
verifica rapida che il setup sia corretto prima di passare a M3-T2.
"""
from config.settings import DatabaseConfig, PathConfig


def run() -> None:
    """Esegue la pipeline ETL end-to-end (da implementare nelle task M3-T2..T5)."""
    print("=== Pipeline ETL Arcadium ===")
    print(f"Database di destinazione : {DatabaseConfig.NAME}@{DatabaseConfig.HOST}:{DatabaseConfig.PORT}")
    print(f"Dataset atteso           : {PathConfig.dataset_path()}")
    print()
    print("Scheletro M3-T1: gli stadi extract/transform/load non sono ancora implementati.")

    # Flusso previsto (verra' completato nelle prossime task):
    # records = extract(...)      # M3-T2
    # cleaned = transform(records)  # M3-T3
    # load(cleaned)               # M3-T4, M3-T5


if __name__ == "__main__":
    run()
