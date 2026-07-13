"use client";

// page.js -> rotta /statistiche (M5-T12) — COLLEGATA al backend (M5-T13).
// -----------------------------------------------------------------------------
// Legge le statistiche reali da GET /api/stats/me e mostra:
//   1. 4 card KPI (giochi posseduti, ore, completamento, generi distinti);
//   2. due grafici: giochi per genere (donut) e per stato (barre).
// I dati che il backend NON fornisce (storico ore mensile, classifica giochi,
// achievement, delta rispetto al mese) sono stati rimossi per restare onesti.

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Gamepad2, Clock, Target, Layers } from "lucide-react";

import { Card, Spinner } from "@/components";
import { getMyStats } from "@/lib/api/stats";
import { KpiCard } from "./KpiCard";
import { Reveal } from "./Reveal";
import { GenreDonut } from "./GenreDonut";
import { StatusBars } from "./StatusBars";
import styles from "./statistiche.module.css";

export default function StatistichePage() {
  const { t, i18n } = useTranslation();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Carica le statistiche personali all'apertura.
  useEffect(() => {
    let attivo = true;
    setLoading(true);
    setError(false);
    getMyStats()
      .then((data) => attivo && setStats(data))
      .catch(() => attivo && setError(true))
      .finally(() => attivo && setLoading(false));
    return () => { attivo = false; };
  }, []);

  // Formatta i numeri col separatore della lingua attiva.
  const nf = (n) => new Intl.NumberFormat(i18n.language).format(n ?? 0);

  // M6-T4 — il backend restituisce `completionRate` come QUOTA in [0,1]
  // (UserStatsResponse: giochi finiti / giochi posseduti). Prima veniva stampata
  // tale e quale seguita da "%", quindi un utente al 42% leggeva "0.42%".
  // Qui la si converte in percentuale intera: la conversione è una scelta di
  // presentazione e resta nel frontend, il contratto dell'API non cambia.
  const percentuale = (quota) => Math.round((quota ?? 0) * 100);

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

      {/* --- 1. Card KPI (solo dati reali) --- */}
      <section className={styles.kpiGrid}>
        <KpiCard
          icon={Gamepad2}
          tone="violet"
          label={t("stats.kpi.totalGames")}
          value={nf(stats.gamesOwned)}
        />
        <KpiCard
          icon={Clock}
          tone="blue"
          label={t("stats.kpi.hoursPlayed")}
          value={`${nf(stats.playtimeHours)}${t("stats.unit.hours")}`}
        />
        <KpiCard
          icon={Target}
          tone="green"
          label={t("stats.kpi.avgCompletion")}
          value={`${percentuale(stats.completionRate)}%`}
        />
        <KpiCard
          icon={Layers}
          tone="amber"
          label={t("stats.kpi.genres")}
          value={nf(stats.distinctGenres)}
        />
      </section>

      {/* --- 2. Grafici (generi + stati) --- */}
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
      </section>
    </div>
  );
}