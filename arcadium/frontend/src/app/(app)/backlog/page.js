"use client";

// Pagina "Backlog" (M5-T11) — COLLEGATA al backend (M5-T13).
// Legge i giochi da GET /api/backlog, li raggruppa nei 4 stati del DB e permette
// di cambiare stato davvero (PATCH /api/backlog/{appId}) via drag&drop o selettore.
// M6: ogni voce porta anche le ore registrate a mano (manualPlaytimeMinutes).

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/components";
import { BACKLOG_STATUSES } from "@/lib/constants";
import { useAuth } from "@/context/AuthProvider";
import { listBacklog, updateBacklog } from "@/lib/api/backlog";
import { BacklogCard } from "./BacklogCard";
import styles from "./backlog.module.css";

// Somma minuti -> ore intere per l'intestazione di sezione. Se Steam e' collegato
// conta il tempo Steam, altrimenti le ore registrate a mano (M6, "Steam vince").
function totalHours(items, steamConnected) {
  const minutes = items.reduce(
    (sum, it) =>
      sum + (steamConnected ? it.playtimeMinutes ?? 0 : it.manualPlaytimeMinutes ?? 0),
    0
  );
  return Math.round(minutes / 60).toLocaleString("it-IT");
}

export default function BacklogPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const steamConnected = Boolean(user?.steamId);

  // Voci del backlog dal backend: { game, status, playtimeMinutes, manualPlaytimeMinutes, ... }.
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // M6: come in Libreria, se il PATCH fallisce non basta ripristinare in
  // silenzio — l'utente va avvisato.
  const [statusError, setStatusError] = useState(false);

  const [draggingId, setDraggingId] = useState(null);
  const [overStatus, setOverStatus] = useState(null);

  // Carica il backlog all'apertura.
  useEffect(() => {
    let attivo = true;
    listBacklog()
      .then((list) => attivo && setItems(list))
      .catch(() => attivo && setError(true))
      .finally(() => attivo && setLoading(false));
    return () => { attivo = false; };
  }, []);

  // Raggruppa per codice stato del DB.
  const byStatus = useMemo(() => {
    const groups = { mai_giocato: [], in_corso: [], finito: [], abbandonato: [] };
    for (const it of items) (groups[it.status.code] ??= []).push(it);
    return groups;
  }, [items]);

  // Cambio stato reale, guidato dalla risposta del server (stesso pattern della
  // Libreria): update ottimistico, riconciliazione con la voce persistita, e in
  // caso di errore ripristino + AVVISO (niente piu' rollback silenzioso).
  async function moveGame(appId, nextCode) {
    const backup = items;
    setStatusError(false);
    setItems((prev) =>
      prev.map((it) =>
        it.game.appId === appId
          ? { ...it, status: { ...it.status, code: nextCode } }
          : it
      )
    );
    try {
      const updated = await updateBacklog(appId, { status: nextCode });
      // Riconcilia con lo stato reale del server (code + etichette).
      setItems((prev) =>
        prev.map((it) =>
          it.game.appId === appId
            ? {
                ...it,
                status: updated.status,
                playtimeMinutes: updated.playtimeMinutes ?? it.playtimeMinutes,
              }
            : it
        )
      );
    } catch {
      setItems(backup); // ripristino
      setStatusError(true); // e avviso all'utente
    }
  }

  function handleDrop(event, statusCode) {
    event.preventDefault();
    const appId = Number(event.dataTransfer.getData("text/plain"));
    if (appId) moveGame(appId, statusCode);
    setOverStatus(null);
    setDraggingId(null);
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t("nav.backlog")}</h1>
      </header>

      {statusError && (
        <div className={styles.statusError} role="alert">
          {t("backlog.statusError")}
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", placeItems: "center", minHeight: 200 }}>
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className={styles.hint}>{t("errors.network")}</p>
      ) : (
        <div className={styles.groups}>
          {BACKLOG_STATUSES.map(({ code, labelKey }) => {
            const list = byStatus[code] ?? [];

            return (
              <section
                key={code}
                className={styles.group}
                data-status={code}
                data-over={overStatus === code || undefined}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverStatus(code);
                }}
                onDragLeave={() =>
                  setOverStatus((current) => (current === code ? null : current))
                }
                onDrop={(event) => handleDrop(event, code)}
              >
                <div className={styles.groupHead}>
                  <span className={styles.groupTitle}>
                    <span className={styles.dot} aria-hidden="true" />
                    {t(labelKey)}
                    <span className={styles.count}>{list.length}</span>
                  </span>
                  <span className={styles.groupMeta}>
                    {totalHours(list, steamConnected)} {t("backlog.hoursUnit")}
                  </span>
                </div>

                {list.length === 0 ? (
                  <p className={styles.empty}>{t("backlog.emptyColumn")}</p>
                ) : (
                  <div className={styles.rows}>
                    {list.map((it) => (
                      <BacklogCard
                        key={it.game.appId}
                        game={it.game}
                        statusCode={it.status.code}
                        playtimeMinutes={it.playtimeMinutes}
                        manualPlaytimeMinutes={it.manualPlaytimeMinutes}
                        onStatusChange={moveGame}
                        onDragStart={setDraggingId}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverStatus(null);
                        }}
                        dragging={draggingId === it.game.appId}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p className={styles.hint}>{t("backlog.hint")}</p>
    </section>
  );
}
