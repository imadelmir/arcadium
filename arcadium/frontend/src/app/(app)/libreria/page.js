"use client";

// Pagina "La tua libreria" (M5-T10).
// Griglia dei giochi posseduti con filtro per stato; ogni gioco è una LibraryCard.

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, GAME_STATUSES } from "@/components";
import { getLibrary } from "./mockLibrary";
import { LibraryCard } from "./LibraryCard";
import styles from "./libreria.module.css";

export default function LibraryPage() {
  const { t } = useTranslation();

  // Copia locale: possiamo cambiare lo stato dei giochi senza toccare il dato.
  const [games, setGames] = useState(() => getLibrary());
  const [filter, setFilter] = useState("all");

  // Conteggio giochi per stato (mostrato nelle tab).
  const counts = useMemo(() => {
    const acc = { never: 0, playing: 0, finished: 0, abandoned: 0 };
    for (const game of games) acc[game.status] = (acc[game.status] ?? 0) + 1;
    return acc;
  }, [games]);

  // Giochi visibili in base alla tab attiva.
  const visible =
    filter === "all" ? games : games.filter((game) => game.status === filter);

  // Aggiorna lo stato di un gioco (in memoria; domani sarà una PATCH all'API).
  function changeStatus(appId, nextStatus) {
    setGames((prev) =>
      prev.map((game) =>
        game.appId === appId ? { ...game, status: nextStatus } : game
      )
    );
  }

  // Tab: "Tutti" + una per ogni stato, con il relativo conteggio.
  const tabs = [
    { value: "all", label: `${t("library.allTab")} · ${games.length}` },
    ...Object.entries(GAME_STATUSES).map(([value, config]) => ({
      value,
      label: `${config.label} · ${counts[value] ?? 0}`,
    })),
  ];

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t("nav.libreria")}</h1>
      </header>

      <Tabs
        items={tabs}
        value={filter}
        onChange={setFilter}
        className={styles.tabs}
      />

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t("library.empty.title")}</p>
          <p className={styles.emptyText}>{t("library.empty.text")}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((game) => (
            <LibraryCard
              key={game.appId}
              game={game}
              onStatusChange={changeStatus}
            />
          ))}
        </div>
      )}
    </section>
  );
}