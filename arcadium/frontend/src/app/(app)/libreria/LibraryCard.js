"use client";

// LibraryCard (M5-T10) — COLLEGATA al backend (M5-T13).
// Card di un gioco posseduto: copertina, stato (StatusBadge coerente col DB),
// ore giocate e selettore per cambiare stato (PATCH reale). Il backend non
// fornisce gli achievement, quindi l'anello di completamento è stato rimosso.
//
// M6: le ore mostrate seguono la regola "Steam vince" — se l'utente ha Steam
// collegato si usa il tempo Steam (playtimeMinutes), altrimenti le ore registrate
// a mano su quel gioco (manualPlaytimeMinutes). L'inserimento avviene nel Backlog.

import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

import { GameImage, StatusBadge } from "@/components";
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

  return (
    <article className={styles.card} data-status={statusCode}>
      <div className={styles.cover}>
        <GameImage src={game.headerImage} alt={game.name} />
        <span className={styles.shade} aria-hidden="true" />

        {/* Stato: usa il badge coerente col resto dell'app */}
        <span className={styles.status}>
          <StatusBadge status={statusCode} />
        </span>

        {/* Selettore per cambiare stato (elenca i 4 stati del DB) */}
        <select
          className={styles.picker}
          aria-label={`${t("library.changeStatusAria")} — ${game.name}`}
          value={statusCode}
          onChange={(event) => onStatusChange(game.appId, event.target.value)}
        >
          {BACKLOG_STATUSES.map((s) => (
            <option key={s.code} value={s.code}>
              {t(s.labelKey)}
            </option>
          ))}
        </select>
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
