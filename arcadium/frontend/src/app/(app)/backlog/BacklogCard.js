"use client";

// BacklogCard (M5-T11) — riga con colore del gioco fuso nello sfondo.
// -----------------------------------------------------------------------------
// Ogni riga si tinge del colore del gioco (coverColor), come la pagina dettaglio:
// sfondo sfumato, barra di completamento e glow in tinta. La riga è più grande
// ed è trascinabile in un'altra sezione; il selettore fa da riserva accessibile.

import { useTranslation } from "react-i18next";
import { GripVertical, Clock } from "lucide-react";

import { GameImage, GAME_STATUSES } from "@/components";
import styles from "./BacklogCard.module.css";

// Minuti -> ore leggibili (un decimale sotto le 10 ore, poi interi).
function formatHours(minutes) {
  const hours = minutes / 60;
  const value = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
  return value.toLocaleString("it-IT");
}

export function BacklogCard({
  game,
  onStatusChange, // (appId, nuovoStato) -> sposta il gioco via selettore
  onDragStart,    // (appId) -> inizio trascinamento
  onDragEnd,      // () -> fine trascinamento
  dragging,       // true se questa riga è quella trascinata
}) {
  const { t } = useTranslation();

  // Percentuale di completamento (0 se il gioco non ha achievement).
  const hasAch = game.achievementsTotal > 0;
  const pct = hasAch
    ? Math.round((game.achievementsUnlocked / game.achievementsTotal) * 100)
    : 0;

  return (
    <article
      className={styles.row}
      data-status={game.status}
      data-dragging={dragging || undefined}
      // Colore del gioco iniettato come variabile CSS (usata da sfondo, barra, glow).
      style={{ "--game": game.coverColor || undefined }}
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

      {/* Nome + barra di completamento */}
      <div className={styles.main}>
        <h3 className={styles.name}>{game.name}</h3>
        <div className={styles.bar}>
          {hasAch && (
            <span className={styles.fill} style={{ "--w": `${pct}%` }} />
          )}
        </div>
      </div>

      {/* Ore giocate */}
      <span className={styles.hours}>
        <Clock size={14} aria-hidden="true" />
        {formatHours(game.playtimeMinutes)} {t("backlog.hoursUnit")}
      </span>

      {/* Percentuale (— se il gioco non ha achievement) */}
      <span className={styles.pct} data-empty={!hasAch || undefined}>
        {hasAch ? `${pct}%` : "—"}
      </span>

      {/* Selettore stato (riserva accessibile allo spostamento) */}
      <label className={styles.moveLabel}>
        <span className={styles.srOnly}>
          {t("backlog.moveAria")} — {game.name}
        </span>
        <select
          className={styles.move}
          value={game.status}
          onChange={(event) => onStatusChange(game.appId, event.target.value)}
        >
          {Object.entries(GAME_STATUSES).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}