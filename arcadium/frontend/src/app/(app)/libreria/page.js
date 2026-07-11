"use client";

// Pagina "La tua libreria" (M5-T10) — COLLEGATA al backend (M5-T13).
// La libreria = i giochi posseduti = GET /api/backlog. Griglia con filtro per
// stato (tab) e cambio stato reale (PATCH /api/backlog/{appId}).

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, Spinner } from "@/components";
import { BACKLOG_STATUSES } from "@/lib/constants";
import { listBacklog, updateBacklog } from "@/lib/api/backlog";
import { LibraryCard } from "./LibraryCard";
import styles from "./libreria.module.css";

export default function LibraryPage() {
  const { t } = useTranslation();

  // Voci dal backend: { game, status:{code,...}, playtimeMinutes, ... }.
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");

  // Carica i giochi posseduti all'apertura.
  useEffect(() => {
    let attivo = true;
    setLoading(true);
    setError(false);
    listBacklog()
      .then((list) => attivo && setItems(list))
      .catch(() => attivo && setError(true))
      .finally(() => attivo && setLoading(false));
    return () => { attivo = false; };
  }, []);

  // Conteggio per stato (per le tab).
  const counts = useMemo(() => {
    const acc = { mai_giocato: 0, in_corso: 0, finito: 0, abbandonato: 0 };
    for (const it of items) acc[it.status.code] = (acc[it.status.code] ?? 0) + 1;
    return acc;
  }, [items]);

  // Giochi visibili in base alla tab attiva.
  const visible =
    filter === "all" ? items : items.filter((it) => it.status.code === filter);

  // Cambio stato reale (aggiorna la UI, chiama PATCH, rollback se fallisce).
  async function changeStatus(appId, nextCode) {
    const backup = items;
    setItems((prev) =>
      prev.map((it) =>
        it.game.appId === appId
          ? { ...it, status: { ...it.status, code: nextCode } }
          : it
      )
    );
    try {
      await updateBacklog(appId, { status: nextCode });
    } catch {
      setItems(backup);
    }
  }

  // Tab: "Tutti" + una per ogni stato del DB, con conteggio.
  const tabs = [
    { value: "all", label: `${t("library.allTab")} · ${items.length}` },
    ...BACKLOG_STATUSES.map((s) => ({
      value: s.code,
      label: `${t(s.labelKey)} · ${counts[s.code] ?? 0}`,
    })),
  ];

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t("nav.libreria")}</h1>
      </header>

      {loading ? (
        <div style={{ display: "grid", placeItems: "center", minHeight: 200 }}>
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>{t("errors.network")}</p>
        </div>
      ) : (
        <>
          <Tabs items={tabs} value={filter} onChange={setFilter} className={styles.tabs} />

          {visible.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{t("library.empty.title")}</p>
              <p className={styles.emptyText}>{t("library.empty.text")}</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {visible.map((it) => (
                <LibraryCard
                  key={it.game.appId}
                  game={it.game}
                  statusCode={it.status.code}
                  playtimeMinutes={it.playtimeMinutes}
                  onStatusChange={changeStatus}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}