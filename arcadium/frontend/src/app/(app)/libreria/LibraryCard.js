"use client";

// LibraryCard (M5-T10) — COLLEGATA al backend (M5-T13).
// Card di un gioco posseduto: copertina, stato (StatusBadge coerente col DB),
// ore giocate e selettore per cambiare stato (PATCH reale).
//
// M6: le ore mostrate seguono la regola "Steam vince" — se l'utente ha Steam
// collegato si usa il tempo Steam (playtimeMinutes), altrimenti le ore registrate
// a mano su quel gioco (manualPlaytimeMinutes). L'inserimento avviene nel Backlog.
//
// Change request: il selettore di stato NON è più un <select> nativo, ma un
// dropdown in stile app — lo STESSO della "tendina delle ore" del Backlog
// (componente FilterDropdown + lista di opzioni), così è coerente col resto.

import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

import { GameImage, StatusBadge, FilterDropdown } from "@/components";
import { BACKLOG_STATUSES } from "@/lib/constants";
import { useAuth } from "@/context/AuthProvider";
import styles from "./LibraryCard.module.css";

// Minuti -> ore leggibili (un decimale sotto le 10 ore, poi interi). null -> 0.
function formatHours(minutes) {
  const hours = (minutes ?? 0) / 60;
  const value = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
  return value.toLocaleString("it-IT");
}

export function LibraryCard({
  game,
  statusCode,
  playtimeMinutes,
  manualPlaytimeMinutes,
  onStatusChange,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const steamConnected = Boolean(user?.steamId);

  // Steam collegato -> tempo Steam; altrimenti totale manuale del gioco.
  const shownMinutes = steamConnected ? playtimeMinutes : manualPlaytimeMinutes ?? 0;

  // Etichetta dello stato corrente per il pulsante della tendina.
  const current = BACKLOG_STATUSES.find((s) => s.code === statusCode);
  const currentLabel = current ? t(current.labelKey) : "";

  return (
    <article className={styles.card} data-status={statusCode}>
      <div className={styles.cover}>
        <GameImage src={game.headerImage} alt={game.name} />
        <span className={styles.shade} aria-hidden="true" />

        {/* Stato: usa il badge coerente col resto dell'app */}
        <span className={styles.status}>
          <StatusBadge status={statusCode} />
        </span>
      </div>

      {/* Selettore di stato in stile app (come la tendina ore del Backlog).
          Sta FUORI da .cover per non essere tagliato dal suo overflow. */}
      <div className={styles.pickerWrap}>
        <FilterDropdown
          className={styles.statusDropdown}
          label={currentLabel}
          align="right"
        >
          <div
            className={styles.statusList}
            role="listbox"
            aria-label={`${t("library.changeStatusAria")} — ${game.name}`}
          >
            {BACKLOG_STATUSES.map((s) => (
              <button
                key={s.code}
                type="button"
                role="option"
                aria-selected={statusCode === s.code}
                data-selected={statusCode === s.code}
                className={styles.statusOption}
                onClick={() => onStatusChange(game.appId, s.code)}
              >
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        </FilterDropdown>
      </div>

      <div className={styles.body}>
        <h2 className={styles.name}>{game.name}</h2>

        <div className={styles.meta}>
          {/* Ore giocate */}
          <span className={styles.hours}>
            <Clock size={15} aria-hidden="true" />
            <strong>{formatHours(shownMinutes)}</strong>{" "}
            {t("library.hoursUnit")}
          </span>
        </div>
      </div>
    </article>
  );
}