"""
Entry point della pipeline ETL di Arcadium (M3).

Orchestra i tre stadi sul dataset Steam:
    EXTRACT   -> lettura in streaming del JSON        (M3-T2, src/extract/)
    TRANSFORM -> pulizia e normalizzazione dei campi  (M3-T3, src/transform/)
    LOAD      -> LookupCache e inserimenti nel DB      (M3-T4, M3-T5, src/load/)

Il caricamento e' in DUE PASSATE sul file, per tenere la memoria costante:
  Passata 1 - LOOKUP    : censisce i record (letti/caricabili/scartati per fascia),
                          costruisce il LookupCache, inserisce le 6 lookup e rilegge
                          le mappe nome -> id_db.
  Passata 2 - CATALOGO  : ri-scorre il file a blocchi (BATCH_SIZE) inserendo games,
                          screenshot e ponti, con commit a fine blocco.

Logging e report (M3-T6):
  - logging su console (sintetico) e su file logs/etl_<timestamp>.log (dettaglio);
  - un LoadReport riepiloga input, scarti per fascia, righe per tabella e durata,
    salvato in logs/report_<timestamp>.txt;
  - gestione errori: un record che fallisce il transform viene loggato e saltato
    (la pipeline prosegue); un blocco che fallisce l'insert provoca il rollback
    del blocco e l'arresto della pipeline (fail-fast), sfruttando l'idempotenza
    (i blocchi gia' committati restano, il rilancio riprende senza duplicare).

Avvio dalla cartella etl/ tramite il launcher run_etl.py (vedi quel file):
    python run_etl.py
    python run_etl.py "C:\\percorso\\steam_games.json"
"""
import logging
import sys
from pathlib import Path

from psycopg import sql

from config.settings import DatabaseConfig, PathConfig
from src.extract.json_reader import read_games
from src.transform.filters import loadable_reason
from src.transform.game import build_game
from src.load.lookup_cache import LookupCache
from src.load.report import LoadReport
from src.db.connection import connect
from src.load import inserter
from src.logging_setup import setup_logging, LOGGER_NAME

BATCH_SIZE = 5000


def _safe_build(record, report=None):
    """Costruisce il game; su errore lo logga e salta (ritorna None).
    Conta l'errore nel report solo se passato (passata 1)."""
    try:
        return build_game(record)
    except Exception as exc:  # record malformato: rete di sicurezza, non blocca
        if report is not None:
            report.add_record_error()
            logging.getLogger(LOGGER_NAME).warning(
                f"record app_id={record.get('AppID')}: errore nel transform, saltato ({exc})"
            )
        return None


def build_lookup_cache(path, report):
    """Passata 1: censisce i record nel report e popola il LookupCache."""
    cache = LookupCache()
    for record in read_games(path):
        reason = loadable_reason(record)
        report.count_record(reason)
        if reason is None:
            game = _safe_build(record, report)
            if game is not None:
                cache.register_game(game)
    return cache


def _flush_block(conn, games, id_maps, block_num):
    """Scrive un blocco (games, screenshot, ponti) e committa.
    Su errore: rollback del blocco, log ERROR e rilancio (fail-fast)."""
    log = logging.getLogger(LOGGER_NAME)
    try:
        inserter.upsert_games(conn, games)
        inserter.upsert_screenshots(conn, games)
        inserter.upsert_bridges(conn, games, id_maps)
        conn.commit()
    except Exception as exc:
        conn.rollback()
        rng = f"{games[0]['app_id']}..{games[-1]['app_id']}"
        log.error(f"blocco {block_num} fallito (app_id {rng}): rollback del blocco. Causa: {exc}")
        raise


def load_catalog(conn, path, id_maps, report):
    """Passata 2: carica games/screenshot/ponti a blocchi di BATCH_SIZE."""
    log = logging.getLogger(LOGGER_NAME)
    batch, total, block = [], 0, 0
    for record in read_games(path):
        if loadable_reason(record) is not None:
            continue
        game = _safe_build(record)  # gia' censito in passata 1: non ri-conta
        if game is None:
            continue
        batch.append(game)
        if len(batch) >= BATCH_SIZE:
            block += 1
            _flush_block(conn, batch, id_maps, block)
            total += len(batch)
            batch = []
            log.info(f"      ... {total:,} giochi")
    if batch:
        block += 1
        _flush_block(conn, batch, id_maps, block)
        total += len(batch)
    return total


def _count_tables(conn):
    """Conta le righe delle 15 tabelle di catalogo (per la sezione OUTPUT del report)."""
    counts = {}
    with conn.cursor() as cur:
        for table in LoadReport.CATALOG_TABLES:
            cur.execute(sql.SQL("SELECT count(*) FROM {}").format(sql.Identifier(table)))
            counts[table] = cur.fetchone()[0]
    return counts


def run(dataset: str | None = None) -> int:
    """Esegue la pipeline ETL end-to-end. Ritorna 0 se ok, 1 in caso di errore."""
    logger, log_path = setup_logging()
    report = LoadReport()

    path = Path(dataset) if dataset else PathConfig.dataset_path()
    if not path.exists():
        logger.error(f"Dataset non trovato: {path}")
        logger.error("Metti il file in etl/data/ o passa il percorso come argomento.")
        return 1

    logger.info(f"=== ETL Arcadium -> {DatabaseConfig.NAME}@{DatabaseConfig.HOST}:{DatabaseConfig.PORT} ===")
    logger.info(f"Dataset: {path}")
    logger.info(f"Log dettagliato: {log_path}")

    code = 0
    try:
        with connect() as conn:
            logger.info("[1/2] Costruzione lookup (deduplica dei valori ripetuti)...")
            cache = build_lookup_cache(path, report)
            inserter.upsert_lookups(conn, cache)
            conn.commit()
            id_maps = inserter.load_lookup_id_maps(conn)
            for lk in cache.all():
                logger.info(f"      {lk.name:<11}: {len(lk):>7,} valori distinti")

            logger.info(f"[2/2] Caricamento catalogo (~{report.loadable:,} giochi, blocchi da {BATCH_SIZE:,})...")
            load_catalog(conn, path, id_maps, report)
            report.set_table_counts(_count_tables(conn))
        report.finish("completato senza errori")
    except Exception as exc:
        report.finish("INTERROTTO per errore")
        logger.error(f"Pipeline interrotta: {exc}")
        code = 1

    # Report finale: sempre, anche in caso di interruzione.
    report_path = log_path.with_name("report_" + log_path.stem.split("_", 1)[1] + ".txt")
    logger.info("\n" + report.summary())
    report.write(report_path)
    logger.info(f"Report salvato in: {report_path}")
    return code


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    raise SystemExit(run(arg))
