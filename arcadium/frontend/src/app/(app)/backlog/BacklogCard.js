"use client";

// BacklogCard (M5-T11) — COLLEGATA al backend (M5-T13).
// -----------------------------------------------------------------------------
// Riga di un gioco nel backlog. Il backend NON fornisce colore cover né
// achievement, quindi restano: copertina, nome, ore giocate e il selettore di
// stato (che ora cambia davvero lo stato via PATCH). Lo `status` del backend è
// un oggetto { code, labelIt, labelEn }: qui si usa il `code`.

import { useTranslation } from "react-i18next";
import { GripVertical, Clock } from "lucide-react";

import { GameImage } from "@/components";
import { BACKLOG_STATUSES } from "@/lib/constants";
import styles from "./BacklogCard.module.css";

// Minuti -> ore leggibili (un decimale sotto le 10 ore, poi interi). null -> 0.
function formatHours(minutes) {
  const hours = (minutes ?? 0) / 60;
  const value = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
  return value.toLocaleString("it-IT");
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
  const { t } = useTranslation();

  return (
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

      {/* Ore giocate */}
      <span className={styles.hours}>
        <Clock size={14} aria-hidden="true" />
        {formatHours(playtimeMinutes)} {t("backlog.hoursUnit")}
      </span>

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
  );
}