"use client";

// BacklogCard (M5-T11) — COLLEGATA al backend (M5-T13); pannello ore in M6.
// -----------------------------------------------------------------------------
// Riga di un gioco nel backlog: copertina, nome, ore giocate, selettore di stato
// e — feature M6 — un pannello espandibile per registrare a mano le ore giocate
// su QUESTO gioco (add/list/delete). Le voci sono datate e alimentano il grafico
// "ore per mese" delle statistiche. Le ore sono quindi sempre legate a un gioco
// della libreria.
//
// "Steam vince": se l'utente ha Steam collegato, il totale ore proviene da Steam
// e l'inserimento manuale e' disabilitato (compare la nota); le voci gia' inserite
// restano visibili come storico ma non modificabili.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, Clock, ChevronDown } from "lucide-react";

import { GameImage } from "@/components";
import { BACKLOG_STATUSES } from "@/lib/constants";
import { useAuth } from "@/context/AuthProvider";
import { listPlaytime, addPlaytime, deletePlaytime } from "@/lib/api/playtime";
import styles from "./BacklogCard.module.css";

// Minuti -> ore leggibili (un decimale sotto le 10 ore, poi interi). null -> 0.
function formatHours(minutes) {
  const hours = (minutes ?? 0) / 60;
  const value = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
  return value.toLocaleString("it-IT");
}

// Data di oggi in formato YYYY-MM-DD, in ora LOCALE (niente slittamenti di fuso).
function todayLocal() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function BacklogCard({
  game,          // il gioco (GameSummary)
  statusCode,    // codice stato corrente: "mai_giocato" | ...
  playtimeMinutes,
  onStatusChange, // (appId, nuovoCodice) -> cambia stato
  onDragStart,
  onDragEnd,
  dragging,
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const steamConnected = Boolean(user?.steamId);

  // Pannello ore: caricamento pigro all'apertura.
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(null); // null = non ancora caricate
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [saving, setSaving] = useState(false);
  const [entryError, setEntryError] = useState(false);

  const loggedMinutes = (entries ?? []).reduce((sum, e) => sum + e.minutes, 0);
  // Ore mostrate sulla riga: se Steam e' collegato -> valore Steam; altrimenti,
  // una volta caricate le voci, il totale manuale di questo gioco.
  const shownMinutes =
    !steamConnected && entries !== null ? loggedMinutes : playtimeMinutes;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && entries === null) {
      setLoading(true);
      try {
        setEntries(await listPlaytime(game.appId));
      } catch {
        setEntries([]);
        setEntryError(true);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleAdd(event) {
    event.preventDefault();
    const minutes = Math.round(parseFloat(hours) * 60);
    if (!minutes || minutes <= 0) return;
    setSaving(true);
    setEntryError(false);
    try {
      const created = await addPlaytime(game.appId, { minutes, playedOn: date });
      setEntries((prev) => [created, ...(prev ?? [])]);
      setHours("");
    } catch {
      setEntryError(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId) {
    const backup = entries;
    setEntries((prev) => (prev ?? []).filter((e) => e.id !== entryId));
    try {
      await deletePlaytime(entryId);
    } catch {
      setEntries(backup);
      setEntryError(true);
    }
  }

  function formatDate(iso) {
    // iso = "YYYY-MM-DD" -> parse come data LOCALE per evitare slittamenti.
    return new Date(`${iso}T00:00:00`).toLocaleDateString(i18n.language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className={styles.card} data-open={open || undefined}>
      <article
        className={styles.row}
        data-status={statusCode}
        data-dragging={dragging || undefined}
        draggable="true"
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", String(game.appId));
          event.dataTransfer.effectAllowed = "move";
          onDragStart(game.appId);
        }}
        onDragEnd={onDragEnd}
      >
        {/* Maniglia trascinamento */}
        <span className={styles.grip} aria-hidden="true">
          <GripVertical size={16} />
        </span>

        {/* Copertina */}
        <span className={styles.cover}>
          <GameImage src={game.headerImage} alt={game.name} />
        </span>

        {/* Nome */}
        <div className={styles.main}>
          <h3 className={styles.name}>{game.name}</h3>
          <div className={styles.bar} />
        </div>

        {/* Ore giocate: pulsante che apre/chiude il pannello ore */}
        <button
          type="button"
          className={styles.hoursBtn}
          onClick={(event) => {
            event.stopPropagation();
            toggle();
          }}
          aria-expanded={open}
          aria-label={t("backlog.playtime.toggleAria")}
        >
          <Clock size={14} aria-hidden="true" />
          {formatHours(shownMinutes)} {t("backlog.hoursUnit")}
          <ChevronDown size={14} className={styles.chev} aria-hidden="true" />
        </button>

        {/* Selettore stato: elenca i 4 stati del DB, etichette tradotte */}
        <label className={styles.moveLabel}>
          <span className={styles.srOnly}>
            {t("backlog.moveAria")} — {game.name}
          </span>
          <select
            className={styles.move}
            value={statusCode}
            onChange={(event) => onStatusChange(game.appId, event.target.value)}
          >
            {BACKLOG_STATUSES.map((s) => (
              <option key={s.code} value={s.code}>
                {t(s.labelKey)}
              </option>
            ))}
          </select>
        </label>
      </article>

      {/* Pannello ore giocate (M6) — sibling della riga: NON trascinabile */}
      {open && (
        <div className={styles.panel}>
          {steamConnected ? (
            <p className={styles.steamNote}>{t("backlog.playtime.steamNote")}</p>
          ) : (
            <form className={styles.addRow} onSubmit={handleAdd}>
              <input
                type="number"
                min="0.1"
                step="0.5"
                inputMode="decimal"
                className={`${styles.addInput} ${styles.addHours}`}
                placeholder={t("backlog.playtime.hoursLabel")}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
              <input
                type="date"
                max={todayLocal()}
                className={styles.addInput}
                aria-label={t("backlog.playtime.dateAria")}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <button
                type="submit"
                className={styles.addBtn}
                disabled={saving || !hours}
              >
                {t("backlog.playtime.add")}
              </button>
            </form>
          )}

          {entryError && <p className={styles.addError}>{t("backlog.playtime.error")}</p>}

          {loading ? (
            <p className={styles.empty}>…</p>
          ) : (entries ?? []).length === 0 ? (
            <p className={styles.empty}>{t("backlog.playtime.empty")}</p>
          ) : (
            <>
              <ul className={styles.entries}>
                {entries.map((e) => (
                  <li key={e.id} className={styles.entry}>
                    <span className={styles.entryDate}>{formatDate(e.playedOn)}</span>
                    <span className={styles.entryHours}>
                      {formatHours(e.minutes)} {t("backlog.hoursUnit")}
                    </span>
                    {!steamConnected && (
                      <button
                        type="button"
                        className={styles.entryDelete}
                        onClick={() => handleDelete(e.id)}
                        aria-label={t("backlog.playtime.deleteAria")}
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <div className={styles.total}>
                {t("backlog.playtime.total")}: {formatHours(loggedMinutes)}{" "}
                {t("backlog.hoursUnit")}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
