"use client";

// LibraryCard (M5-T10)
// -----------------------------------------------------------------------------
// Card di un gioco nella libreria. Mostra copertina, stato (colorato in base
// al tipo), ore giocate e un anello di completamento achievement animato, con
// la percentuale che si "conta" da 0 fino al valore reale al montaggio.

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Trophy } from "lucide-react";

import { GameImage, GAME_STATUSES } from "@/components";
import styles from "./LibraryCard.module.css";

// Minuti -> ore leggibili (un decimale sotto le 10 ore, poi interi).
function formatHours(minutes) {
  const hours = minutes / 60;
  const value = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
  return value.toLocaleString("it-IT");
}

// Piccolo hook: anima un numero da 0 al target con easing "ease-out".
function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // rallenta verso la fine
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function LibraryCard({ game, onStatusChange }) {
  const { t } = useTranslation();

  const status = GAME_STATUSES[game.status] ?? GAME_STATUSES.never;
  const hasAchievements = game.achievementsTotal > 0;

  // Percentuale di completamento achievement (0 se il gioco non ne ha).
  const pct = hasAchievements
    ? Math.round((game.achievementsUnlocked / game.achievementsTotal) * 100)
    : 0;
  const shownPct = useCountUp(pct); // numero animato al centro dell'anello

  // Geometria dell'anello SVG.
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const target = circumference * (1 - pct / 100); // offset finale dell'anello

  return (
    <article className={styles.card} data-status={game.status}>
      <div className={styles.cover}>
        <GameImage src={game.headerImage} alt={game.name} />
        <span className={styles.shade} aria-hidden="true" />

        {/* Stato colorato in base al tipo (token --status-*) */}
        <span className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          {status.label}
        </span>

        {/* Selettore per cambiare stato */}
        <select
          className={styles.picker}
          aria-label={`${t("library.changeStatusAria")} — ${game.name}`}
          value={game.status}
          onChange={(event) => onStatusChange(game.appId, event.target.value)}
        >
          {Object.entries(GAME_STATUSES).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
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
            <strong>{formatHours(game.playtimeMinutes)}</strong>{" "}
            {t("library.hoursUnit")}
          </span>

          {/* Completamento achievement: anello animato + percentuale */}
          {hasAchievements ? (
            <div
              className={styles.completion}
              title={`${game.achievementsUnlocked}/${game.achievementsTotal}`}
            >
              <svg className={styles.ring} width="48" height="48" viewBox="0 0 48 48">
                <circle className={styles.ringTrack} cx="24" cy="24" r={radius} />
                <circle
                  className={styles.ringFill}
                  cx="24"
                  cy="24"
                  r={radius}
                  style={{ "--circ": circumference, "--target": target }}
                />
              </svg>
              <span className={styles.pct}>{shownPct}%</span>
            </div>
          ) : (
            <span className={styles.noAch}>
              <Trophy size={15} aria-hidden="true" />
              {t("library.noAchievements")}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}