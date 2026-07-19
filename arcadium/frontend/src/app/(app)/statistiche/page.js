"use client";

// page.js -> rotta /statistiche (M5-T12) — COLLEGATA al backend (M5-T13).
// -----------------------------------------------------------------------------
// Legge le statistiche reali da GET /api/stats/me e mostra:
//   1. 4 card KPI (giochi posseduti, ore, completamento, generi distinti);
//   2. tre grafici: giochi per genere (donut), per stato (barre) e ore giocate
//      per mese (area, feature M6, dalla serie `monthly` del registro manuale)
//      OPPURE, con Steam collegato, i giochi piu' giocati (barre orizzontali).
//      La scelta la fa il backend con `playtimeSource`: Steam espone solo il
//      totale di sempre per gioco, senza date, quindi una serie mensile costruita
//      su quel dato sarebbe piatta. Meglio mostrare l'informazione che c'e'
//      davvero — come le ore si distribuiscono fra i titoli — che una linea a
//      zero o una attribuzione temporale inventata.

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Gamepad2, Clock, Target, Layers } from "lucide-react";

import { Card, Spinner } from "@/components";
import { getMyStats } from "@/lib/api/stats";
import { KpiCard } from "./KpiCard";
import { Reveal } from "./Reveal";
import { GenreDonut } from "./GenreDonut";
import { StatusBars } from "./StatusBars";
import { HoursAreaChart } from "./HoursAreaChart";
import { TopGamesBars } from "./TopGamesBars";
import styles from "./statistiche.module.css";

// Conteggio animato: il numero sale da 0 al valore finale (stesso effetto della
// pagina Achievement). Restituisce un numero: la formattazione resta a chi lo usa.
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(target)) { setVal(0); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easing morbido
      setVal(eased * target);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export default function StatistichePage() {
  const { t, i18n } = useTranslation();

  const [stats, setStats] = useState(null);

  // Conteggio animato dei KPI. Va chiamato SEMPRE, prima degli early return
  // (loading/errore): gli hook non possono stare dopo un return condizionale.
  const cGames = useCountUp(stats?.gamesOwned ?? 0);
  const cHours = useCountUp(stats?.playtimeHours ?? 0);
  const cCompletion = useCountUp((stats?.completionRate ?? 0) * 100);
  const cGenres = useCountUp(stats?.distinctGenres ?? 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Carica le statistiche personali all'apertura.
  useEffect(() => {
    let attivo = true;
    // M6-T4: niente setState sincrono qui dentro. `loading` parte gia' a true
    // dalla useState e l'effetto gira una volta sola (deps []): il vecchio
    // setLoading(true)/setError(false) provocava solo un render in piu'.
    getMyStats()
      .then((data) => attivo && setStats(data))
      .catch(() => attivo && setError(true))
      .finally(() => attivo && setLoading(false));
    return () => { attivo = false; };
  }, []);

  // Formatta i numeri col separatore della lingua attiva.
  const nf = (n) => new Intl.NumberFormat(i18n.language).format(n ?? 0);


  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: "grid", placeItems: "center", minHeight: 260 }}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("pages.statistiche.title")}</h1>
        </header>
        <p>{t("errors.network")}</p>
      </div>
    );
  }

  // Dati per il grafico generi: il backend dà già { name, count }.
  // Da dove arrivano le ore, secondo il backend: "steam" (totali sincronizzati,
  // senza date) oppure "manual" (registro datato). Decide quale grafico mostrare.
  const steamHours = stats.playtimeSource === "steam";

  const genreData = stats.topGenres ?? [];

  // Dati per il grafico stati: StatusBars usa `key` (per il colore) e `label`.
  // Passiamo il code come key e l'etichetta pronta dal backend (IT o EN).
  const statusData = (stats.byStatus ?? []).map((s) => ({
    key: s.code,
    count: s.count,
    label: i18n.language === "en" ? s.labelEn : s.labelIt,
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("pages.statistiche.title")}</h1>
      </header>

      {/* Area che scorre: la testata sopra resta FUORI, quindi nessuna card le
          passa dietro e puo' restare trasparente (l'effetto animato di sfondo
          resta visibile come prima). */}
      <div className={styles.scrollArea}>

      {/* --- 1. Card KPI (solo dati reali) --- */}
      <section className={styles.kpiGrid}>
        <KpiCard
          icon={Gamepad2}
          tone="violet"
          label={t("stats.kpi.totalGames")}
          value={nf(Math.round(cGames))}
        />
        <KpiCard
          icon={Clock}
          tone="blue"
          label={t("stats.kpi.hoursPlayed")}
          value={`${nf(Math.round(cHours))}${t("stats.unit.hours")}`}
        />
        <KpiCard
          icon={Target}
          tone="green"
          label={t("stats.kpi.avgCompletion")}
          value={`${Math.round(cCompletion)}%`}
        />
        <KpiCard
          icon={Layers}
          tone="amber"
          label={t("stats.kpi.genres")}
          value={nf(Math.round(cGenres))}
        />
      </section>

      {/* --- 2. Grafici (generi + stati + ore per mese) --- */}
      <section className={styles.charts}>
        <Card padding="lg">
          <div className={styles.chartHead}>
            <h2 className={styles.chartTitle}>{t("stats.charts.genreTitle")}</h2>
          </div>
          <Reveal minHeight={240}>
            <GenreDonut data={genreData} />
          </Reveal>
        </Card>

        <Card padding="lg">
          <div className={styles.chartHead}>
            <h2 className={styles.chartTitle}>{t("stats.charts.statusTitle")}</h2>
          </div>
          <Reveal minHeight={240}>
            <StatusBars data={statusData} />
          </Reveal>
        </Card>

        {/* Ore giocate, a tutta larghezza. Con Steam collegato la serie mensile
            non esiste (nessuna data nel dato di Steam): al suo posto la
            classifica dei giochi piu' giocati, che le stesse ore le contengono. */}
        <div style={{ gridColumn: "1 / -1" }}>
          <Card padding="lg">
            <div className={styles.chartHead}>
              <h2 className={styles.chartTitle}>
                {steamHours ? t("stats.charts.topGamesTitle") : t("stats.charts.hoursTitle")}
              </h2>
            </div>
            <Reveal minHeight={340}>
              {steamHours ? (
                <TopGamesBars data={stats.topGames ?? []} />
              ) : (
                <HoursAreaChart data={stats.monthly ?? []} />
              )}
            </Reveal>
          </Card>
        </div>
      </section>
      </div>
    </div>
  );
}
