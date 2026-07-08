"use client";

// Pagina "Backlog" (M5-T11) — stile lista raggruppata.
// I giochi sono divisi in sezioni per stato (mai giocato / in corso / finito /
// abbandonato). Ogni sezione è una zona di rilascio: trascinando una riga al suo
// interno il gioco assume quello stato. In attesa del backend lavora sul dataset
// finto: l'aggancio all'endpoint backlog (M4-T8) sarà la sola sostituzione dati.

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { GAME_STATUSES } from "@/components";
import { getBacklog, BACKLOG_COLUMNS } from "./mockBacklog";
import { BacklogCard } from "./BacklogCard";
import styles from "./backlog.module.css";

// Minuti totali di una lista -> ore intere (per l'intestazione di sezione).
function totalHours(games) {
  const minutes = games.reduce((sum, game) => sum + game.playtimeMinutes, 0);
  return Math.round(minutes / 60).toLocaleString("it-IT");
}

export default function BacklogPage() {
  const { t } = useTranslation();

  // Copia locale dei giochi: la spostiamo tra le sezioni senza toccare il dato.
  const [games, setGames] = useState(() => getBacklog());
  const [draggingId, setDraggingId] = useState(null); // riga trascinata
  const [overStatus, setOverStatus] = useState(null);  // sezione evidenziata

  // Raggruppa i giochi per stato, così ogni sezione pesca la sua lista.
  const byStatus = useMemo(() => {
    const groups = { never: [], playing: [], finished: [], abandoned: [] };
    for (const game of games) (groups[game.status] ??= []).push(game);
    return groups;
  }, [games]);

  // Cambia lo stato di un gioco (usato dal drop e dal selettore).
  function moveGame(appId, nextStatus) {
    setGames((prev) =>
      prev.map((game) =>
        game.appId === appId ? { ...game, status: nextStatus } : game
      )
    );
  }

  // Rilascio su una sezione: il gioco trascinato prende lo stato della sezione.
  function handleDrop(event, status) {
    event.preventDefault();
    const appId = Number(event.dataTransfer.getData("text/plain"));
    if (appId) moveGame(appId, status);
    setOverStatus(null);
    setDraggingId(null);
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t("nav.backlog")}</h1>
      </header>

      <div className={styles.groups}>
        {BACKLOG_COLUMNS.map((status) => {
          const list = byStatus[status] ?? [];
          const config = GAME_STATUSES[status];

          return (
            <section
              key={status}
              className={styles.group}
              data-status={status}
              data-over={overStatus === status || undefined}
              onDragOver={(event) => {
                event.preventDefault();
                setOverStatus(status);
              }}
              onDragLeave={() =>
                setOverStatus((current) => (current === status ? null : current))
              }
              onDrop={(event) => handleDrop(event, status)}
            >
              <div className={styles.groupHead}>
                <span className={styles.groupTitle}>
                  <span className={styles.dot} aria-hidden="true" />
                  {config.label}
                  <span className={styles.count}>{list.length}</span>
                </span>
                <span className={styles.groupMeta}>
                  {totalHours(list)} {t("backlog.hoursUnit")}
                </span>
              </div>

              {list.length === 0 ? (
                <p className={styles.empty}>{t("backlog.emptyColumn")}</p>
              ) : (
                <div className={styles.rows}>
                  {list.map((game) => (
                    <BacklogCard
                      key={game.appId}
                      game={game}
                      onStatusChange={moveGame}
                      onDragStart={setDraggingId}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverStatus(null);
                      }}
                      dragging={draggingId === game.appId}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p className={styles.hint}>{t("backlog.hint")}</p>
    </section>
  );
}