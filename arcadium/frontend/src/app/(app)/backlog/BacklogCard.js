"use client";

// BacklogCard (M5-T11) — COLLEGATA al backend (M5-T13); pannello ore in M6.
// -----------------------------------------------------------------------------
// Riga di un gioco nel backlog: copertina, nome, ore giocate, selettore di stato
// e — feature M6 — un pannello espandibile per registrare a mano le ore giocate
// su QUESTO gioco (add/list/delete). Le voci sono datate e alimentano il grafico
// "ore per mese" delle statistiche; le ore sono sempre legate a un gioco della
// libreria.
//
// Ore mostrate sulla riga: se Steam e' collegato -> totale Steam; altrimenti il
// totale manuale del gioco (`manualPlaytimeMinutes` dal backend, aggiornato in
// locale mentre il pannello e' aperto). Cosi' le ore restano visibili anche
// senza aprire il pannello e dopo un cambio pagina.
//
// "Steam vince": con Steam collegato l'inserimento e' disabilitato (nota); le
// voci gia' presenti restano come storico ma non modificabili.

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, Clock, ChevronDown } from "lucide-react";

import { GameImage } from "@/components";
import { BACKLOG_STATUSES } from "@/lib/constants";
import { useAuth } from "@/context/AuthProvider";
import { listPlaytime, addPlaytime, deletePlaytime } from "@/lib/api/playtime";
import { FilterDropdown } from "@/components";
import styles from "./BacklogCard.module.css";

// Opzioni durata: da 30 min a 24 h, a passi di 30 min (valore in MINUTI).
const DURATION_OPTIONS = Array.from({ length: 48 }, (_, i) => (i + 1) * 30);
const MAX_MINUTES_PER_DAY = 24 * 60;

// Minuti -> ore leggibili (un decimale sotto le 10 ore, poi interi). null -> 0.
function formatHours(minutes) {
  const hours = (minutes ?? 0) / 60;
  const value = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
  return value.toLocaleString("it-IT");
}

// Durata leggibile per le opzioni del selettore: "30 min", "1 h", "1 h 30 min".
function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
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
  manualPlaytimeMinutes, // ore manuali totali del gioco (dal backend)
  onStatusChange, // (appId, nuovoCodice) -> cambia stato
  onDragStart,
  onDragEnd,
  dragging,
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const steamConnected = Boolean(user?.steamId);

  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(null); // null = non ancora caricate
  const [loading, setLoading] = useState(false);
  const [minutes, setMinutes] = useState("60"); // selezione durata (default 1 h)
  const [date, setDate] = useState(todayLocal());
  const [saving, setSaving] = useState(false);
  const [entryError, setEntryError] = useState(false);
  const [dayLimit, setDayLimit] = useState(false);
  const [saved, setSaved] = useState(false);

  // Conferma "ore salvate" transitoria (come il salvataggio profilo).
  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(id);
  }, [saved]);

  const loggedMinutes = (entries ?? []).reduce((sum, e) => sum + e.minutes, 0);
  // Ore mostrate sulla riga: Steam -> valore Steam; altrimenti totale manuale
  // (dal backend, oppure quello locale se il pannello e' gia' aperto).
  const shownMinutes = steamConnected
    ? playtimeMinutes
    : entries !== null
      ? loggedMinutes
      : manualPlaytimeMinutes ?? 0;

  async function toggle() {
    const next = !open;
    setOpen(next); // secondo click -> chiude
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
    const newMinutes = Number(minutes);
    if (!newMinutes) return;

    // Cap realistico: max 24 h nello stesso giorno su questo gioco.
    const sameDay = (entries ?? [])
      .filter((e) => e.playedOn === date)
      .reduce((sum, e) => sum + e.minutes, 0);
    if (sameDay + newMinutes > MAX_MINUTES_PER_DAY) {
      setDayLimit(true);
      return;
    }

    setSaving(true);
    setEntryError(false);
    setDayLimit(false);
    try {
      const created = await addPlaytime(game.appId, { minutes: newMinutes, playedOn: date });
      setEntries((prev) => [created, ...(prev ?? [])]);
      setSaved(true);
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
        <span className={styles.grip} aria-hidden="true">
          <GripVertical size={16} />
        </span>

        <span className={styles.cover}>
          <GameImage src={game.headerImage} alt={game.name} />
        </span>

        <div className={styles.main}>
          <h3 className={styles.name}>{game.name}</h3>
          <div className={styles.bar} />
        </div>

        {/* Ore giocate: pulsante che apre/chiude il pannello (secondo click chiude) */}
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
              {/* Tendina ore nello stile dei filtri del Negozio: la lista di un
                  <select> nativo e' disegnata dal sistema (colori fuori tema e
                  48 voci senza limite d'altezza). Qui la lista e' nostra, quindi
                  ha i colori dell'app e scorre entro un'altezza massima. */}
              <FilterDropdown
                label={formatDuration(Number(minutes))}
                className={styles.addHours}
              >
                <div className={styles.hoursList} role="listbox"
                     aria-label={t("backlog.playtime.hoursLabel")}>
                  {DURATION_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="option"
                      aria-selected={Number(minutes) === m}
                      className={styles.hoursOption}
                      data-selected={Number(minutes) === m}
                      onClick={() => {
                        setMinutes(String(m));
                        setDayLimit(false);
                      }}
                    >
                      {formatDuration(m)}
                    </button>
                  ))}
                </div>
              </FilterDropdown>
              <input
                type="date"
                max={todayLocal()}
                className={styles.addInput}
                aria-label={t("backlog.playtime.dateAria")}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setDayLimit(false);
                }}
              />
              <button type="submit" className={styles.addBtn} disabled={saving}>
                {t("backlog.playtime.add")}
              </button>
            </form>
          )}

          {saved && <p className={styles.saved}>{t("backlog.playtime.saved")}</p>}
          {dayLimit && <p className={styles.addError}>{t("backlog.playtime.dayLimit")}</p>}
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
