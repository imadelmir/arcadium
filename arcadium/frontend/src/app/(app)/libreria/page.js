"use client";

// Pagina "La tua libreria" (M5-T10) — COLLEGATA al backend (M5-T13).
// La libreria = i giochi posseduti = GET /api/backlog. Griglia con filtro per
// stato (tab) e cambio stato reale (PATCH /api/backlog/{appId}).
//
// FIX bug "In corso" (change request Libreria, punto 7):
//   il cambio stato ora è guidato dalla RISPOSTA del server. Dopo il PATCH, la
//   voce locale viene riconciliata con lo stato restituito dal backend (fonte
//   di verità): così ciò che si vede coincide con ciò che è stato persistito e
//   sopravvive al reload. In caso di errore si ripristina lo stato precedente e
//   si mostra un avviso (niente più fallimenti silenziosi).

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
  // Avviso quando il salvataggio di un cambio stato fallisce.
  const [statusError, setStatusError] = useState(false);

  // Carica i giochi posseduti all'apertura.
  useEffect(() => {
    let attivo = true;
    // M6-T4: niente setState sincrono qui dentro. `loading` parte gia' a true
    // dalla useState e l'effetto gira una volta sola (deps []): il vecchio
    // setLoading(true)/setError(false) provocava solo un render in piu'.
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

  // Cambio stato reale, guidato dalla risposta del server.
  async function changeStatus(appId, nextCode) {
    // 1) Aggiornamento OTTIMISTICO: la UI risponde subito.
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
      // 2) PATCH: invia il CODICE dello stato (es. "in_corso") e riceve la voce
      //    aggiornata dal backend (BacklogItemResponse), con lo stato reale.
      const updated = await updateBacklog(appId, { status: nextCode });

      // 3) RICONCILIAZIONE con la risposta: lo stato locale diventa quello
      //    persistito dal server (code + etichette), non un valore "presunto".
      //    È questo il passaggio che garantisce coerenza dopo il reload.
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
      // 4) Fallimento: ripristina lo stato precedente e AVVISA l'utente
      //    (niente fallimento silenzioso: prima l'errore veniva ignorato).
      setItems(backup);
      setStatusError(true);
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

      {/* Avviso di errore sul salvataggio del cambio stato */}
      {statusError && (
        <div className={styles.statusError} role="alert">
          {t("library.statusError")}
        </div>
      )}

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
