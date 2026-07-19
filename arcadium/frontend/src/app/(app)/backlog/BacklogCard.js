"use client";

// BacklogCard (M5-T11) — COLLEGATA al backend (M5-T13); pannello ore in M6.
// -----------------------------------------------------------------------------
// Riga di un gioco nel backlog: copertina, nome, ore giocate, selettore di stato
// e — feature M6 — un pannello espandibile per registrare a mano le ore giocate
// su QUESTO gioco (add/list/delete). Le voci sono datate e alimentano il grafico
// "ore per mese" delle statistiche; le ore sono sempre legate a un gioco della
// libreria.
//
// Ore mostrate sulla riga: se QUESTO gioco arriva dalla sync Steam -> totale
// Steam; altrimenti il totale manuale del gioco (`manualPlaytimeMinutes` dal
// backend, aggiornato in locale mentre il pannello e' aperto). Cosi' le ore
// restano visibili anche senza aprire il pannello e dopo un cambio pagina.
//
// "Steam vince", ma UN GIOCO ALLA VOLTA. Il blocco non dipende dall'avere un
// account Steam collegato, bensi' dal fatto che le ore di questa riga vengano
// da Steam: il backend valorizza `playtimeMinutes` solo nella sync, mentre le
// voci aggiunte a mano lo lasciano nullo. Un gioco che su Steam non possiedi
// (comprato altrove, aggiunto manualmente) resta quindi modificabile anche con
// l'account collegato — prima veniva bloccato anche quello, senza motivo.
// Quando la riga e' gestita da Steam il pannello mostra un lucchetto e spiega
// perche': le ore le tiene Steam, e riscriverle a mano creerebbe due verita'.

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, Clock, ChevronDown, Lock } from "lucide-react";

import { GameImage } from "@/components";
import { BACKLOG_STATUSES } from "@/lib/constants";
import { useAuth } from "@/context/AuthProvider";
import { listPlaytime, addPlaytime, deletePlaytime } from "@/lib/api/playtime";
import { getAverageColor } from "@/lib/imageColor";
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

// Percentuale di riempimento della barra sotto il titolo. La regola dipende
// dal fatto che il gioco sia stato FINITO almeno una volta (finishedAt), non
// solo dallo stato attuale:
//   - "mai_giocato"                 -> 0%, sempre vuota;
//   - "finito" (ora) OPPURE già finito in passato -> 100%, sempre piena.
//     Così spostando un gioco finito su "in corso"/"abbandonato" la barra
//     RESTA piena (cambiano solo le ore, che si possono aggiungere);
//   - "in_corso"/"abbandonato" MAI finiti -> proporzionale alle ore, da ZERO
//     (vuota senza ore), fino a un tetto (non è finito, quindi mai pieno).
const FILL_HALF_HOURS = 48;   // ore a cui la barra è circa a metà
const FILL_MAX_PERCENT = 92;  // tetto per un gioco non ancora "finito"

function computeFillPercent(statusCode, minutes, wasFinished) {
  if (statusCode === "finito" || wasFinished) return 100;
  // "Mai giocato" con ore alle spalle e' una contraddizione (la sync Steam ora
  // la corregge alla fonte). Qui restiamo comunque coerenti con il numero che
  // la riga sta mostrando: se ci sono ore, la barra non puo' essere vuota.
  if (statusCode === "mai_giocato" && !(minutes > 0)) return 0;

  const hours = (minutes ?? 0) / 60;
  const percent = (hours / FILL_HALF_HOURS) * 50; // 0 ore -> 0%, 48 ore -> 50%
  return Math.min(FILL_MAX_PERCENT, Math.max(0, percent));
}

// Colore di RISERVA per la riga, usato finché il colore reale della copertina
// non è ancora pronto (il canvas carica l'immagine in modo asincrono) o se
// l'estrazione fallisce (CORS, immagine mancante, ecc — vedi imageColor.js).
// Generato dall'appId: stesso gioco -> sempre lo stesso colore di riserva.
function hashToHue(seed) {
  const str = String(seed ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

function gameAccentColor(game) {
  const hue = hashToHue(game?.appId ?? game?.name);
  return `hsl(${hue}, 72%, 62%)`;
}

export function BacklogCard({
  game,          // il gioco (GameSummary)
  statusCode,    // codice stato corrente: "mai_giocato" | ...
  finishedAt,    // data del primo passaggio a "finito" (null se mai finito)
  playtimeMinutes,
  manualPlaytimeMinutes, // ore manuali totali del gioco (dal backend)
  onStatusChange, // (appId, nuovoCodice) -> cambia stato
  onDragStart,
  onDragEnd,
  dragging,
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  // Blocco per GIOCO: conta che le ore di questa riga arrivino da Steam, non che
  // l'utente abbia un account collegato. `playtimeMinutes` lo valorizza solo la
  // sync; le voci aggiunte a mano lo lasciano nullo e restano modificabili.
  const steamManaged = Boolean(user?.steamId) && playtimeMinutes != null;

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
  const shownMinutes = steamManaged
    ? playtimeMinutes
    : entries !== null
      ? loggedMinutes
      : manualPlaytimeMinutes ?? 0;

  const fillPercent = computeFillPercent(statusCode, shownMinutes, Boolean(finishedAt));

  // Etichetta dello stato corrente, mostrata sulla pillola della tendina.
  const statusLabelKey =
    BACKLOG_STATUSES.find((s) => s.code === statusCode)?.labelKey ?? "backlog.moveAria";

  // Colore della riga preso dalla copertina reale (come il backdrop sfocato
  // della pagina di dettaglio): parte dal colore di riserva (hash sull'appId)
  // e passa a quello estratto dai pixel non appena è pronto. Per copertina,
  // così non lo si ricalcola a ogni riordino/filtro del backlog.
  const [gameColor, setGameColor] = useState(() => gameAccentColor(game));

  useEffect(() => {
    let cancelled = false;
    setGameColor(gameAccentColor(game)); // riserva subito, poi eventuale upgrade
    getAverageColor(game.headerImage).then((color) => {
      if (!cancelled && color) setGameColor(color);
    });
    return () => {
      cancelled = true;
    };
  }, [game]);

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
        style={{ "--game": gameColor }}
      >
        {/* Solo la maniglia è trascinabile: così il <select> e gli altri
            controlli restano sempre cliccabili (in Chrome, un <select> dentro
            un elemento draggable a volte fa partire il drag e non cambia stato). */}
        <span
          className={styles.grip}
          aria-hidden="true"
          draggable="true"
          onDragStart={(event) => {
            event.dataTransfer.setData("text/plain", String(game.appId));
            event.dataTransfer.effectAllowed = "move";
            onDragStart(game.appId);
          }}
          onDragEnd={onDragEnd}
        >
          <GripVertical size={16} />
        </span>

        <span className={styles.cover}>
          <GameImage src={game.headerImage} alt={game.name} />
        </span>

        <div className={styles.main}>
          <h3 className={styles.name}>{game.name}</h3>
          <div className={styles.bar}>
            {fillPercent > 0 && (
              <span
                className={styles.fill}
                style={{ "--w": `${fillPercent}%` }}
              />
            )}
          </div>
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
          data-locked={steamManaged || undefined}
          title={steamManaged ? t("backlog.playtime.lockedTitle") : undefined}
        >
          {steamManaged
            ? <Lock size={13} aria-hidden="true" />
            : <Clock size={14} aria-hidden="true" />}
          {formatHours(shownMinutes)} {t("backlog.hoursUnit")}
          <ChevronDown size={14} className={styles.chev} aria-hidden="true" />
        </button>

        {/* Selettore di stato. Era un <select> nativo: la sua lista la disegna
            il sistema operativo, quindi arrivava con colori fuori tema e
            stonava accanto alla tendina delle ore, che gia' usa il pannello
            condiviso dei filtri. Stesso componente, stesse voci, stesso stile
            in tutta l'app — e closeOnSelect perche' qui la scelta e' una sola,
            come faceva il controllo nativo. */}
        <div className={styles.moveLabel}>
          <span className={styles.srOnly}>
            {t("backlog.moveAria")} — {game.name}
          </span>
          <FilterDropdown
            label={t(statusLabelKey)}
            align="right"
            closeOnSelect
            className={styles.moveDropdown}
          >
            <div
              className={styles.hoursList}
              role="listbox"
              aria-label={t("backlog.moveAria")}
            >
              {BACKLOG_STATUSES.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  role="option"
                  aria-selected={statusCode === s.code}
                  className={styles.hoursOption}
                  data-selected={statusCode === s.code}
                  onClick={() => onStatusChange(game.appId, s.code)}
                >
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
          </FilterDropdown>
        </div>
      </article>

      {/* Pannello ore giocate (M6) — sibling della riga: NON trascinabile */}
      {open && (
        <div className={styles.panel}>
          {steamManaged ? (
            <p className={styles.lockedNote}>
              <Lock size={14} aria-hidden="true" />
              <span>
                <strong>{t("backlog.playtime.lockedTitle")}</strong>{" "}
                {t("backlog.playtime.lockedText")}
              </span>
            </p>
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
                    {!steamManaged && (
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