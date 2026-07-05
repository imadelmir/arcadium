"""
Report di caricamento della pipeline ETL (M3-T6).

Raccoglie i numeri di un'esecuzione e produce un riepilogo leggibile, stampato a
schermo e salvato in logs/. Distingue i record in ingresso (letti, caricabili,
scartati per fascia) dalle righe scritte nel database (per tabella), e registra
durata ed esito.

Le fasce di scarto sono quelle del filtro di caricabilita' (M3-T3):
app_id_null, name_missing, stub.
"""
from datetime import datetime
from pathlib import Path


def _fmt(n) -> str:
    """Numero con il punto come separatore delle migliaia (stile documenti IT)."""
    return f"{n:,}".replace(",", ".")


class LoadReport:
    # Fasce di scarto del filtro di caricabilita' (M3-T3).
    SKIP_REASONS = ("app_id_null", "name_missing", "stub")

    # Tabelle del catalogo, nell'ordine in cui compaiono nel report.
    CATALOG_TABLES = (
        "games", "language", "developer", "publisher", "category", "genre", "tag",
        "game_language", "game_audio_language", "game_developer", "game_publisher",
        "game_category", "game_genre", "game_tag", "game_screenshot",
    )

    def __init__(self):
        self.records_read = 0
        self.loadable = 0
        self.skipped = {r: 0 for r in self.SKIP_REASONS}
        self.record_errors = 0
        self.table_counts = {}
        self.started_at = datetime.now()
        self.finished_at = None
        self.status = "in corso"

    # --- raccolta durante il run ------------------------------------------

    def count_record(self, reason) -> None:
        """Registra un record letto. reason=None se caricabile, altrimenti la fascia."""
        self.records_read += 1
        if reason is None:
            self.loadable += 1
        else:
            self.skipped[reason] = self.skipped.get(reason, 0) + 1

    def add_record_error(self) -> None:
        """Registra un record saltato per errore durante il transform."""
        self.record_errors += 1

    def set_table_counts(self, counts: dict) -> None:
        """Imposta il conteggio righe per tabella (letto dal DB a fine run)."""
        self.table_counts = counts

    def finish(self, status: str = "completato") -> None:
        self.finished_at = datetime.now()
        self.status = status

    def duration_seconds(self) -> float:
        end = self.finished_at or datetime.now()
        return (end - self.started_at).total_seconds()

    # --- output ------------------------------------------------------------

    def summary(self) -> str:
        """Costruisce il testo del report."""
        skipped_total = sum(self.skipped.values())
        line = "=" * 60
        rows = [
            line,
            " REPORT DI CARICAMENTO — Arcadium ETL",
            line,
            f" Avvio    : {self.started_at:%Y-%m-%d %H:%M:%S}",
            f" Fine     : {self.finished_at:%Y-%m-%d %H:%M:%S}" if self.finished_at else " Fine     : —",
            f" Durata   : {self.duration_seconds():.1f} s",
            "",
            " INPUT",
            f"   Record letti        : {_fmt(self.records_read):>9}",
            f"   Caricabili          : {_fmt(self.loadable):>9}",
            f"   Scartati            : {_fmt(skipped_total):>9}",
        ]
        for reason in self.SKIP_REASONS:
            rows.append(f"     - {reason:<16}: {_fmt(self.skipped.get(reason, 0)):>9}")
        rows.append(f"   Errori su record    : {_fmt(self.record_errors):>9}")

        if self.table_counts:
            rows += ["", " OUTPUT (righe nel database)"]
            for table in self.CATALOG_TABLES:
                if table in self.table_counts:
                    rows.append(f"   {table:<20}: {_fmt(self.table_counts[table]):>9}")

        rows += ["", f" ESITO: {self.status}", line]
        return "\n".join(rows)

    def write(self, path: Path) -> None:
        """Salva il report su file (accanto al log dell'esecuzione)."""
        Path(path).write_text(self.summary() + "\n", encoding="utf-8")
