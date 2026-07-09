"use client";

// page.js  ->  rotta /statistiche
// -----------------------------------------------------------------------------
// Pagina Statistiche (M5-T12). Mostra, dall'alto verso il basso:
//   1. una riga di 4 card KPI (giochi, ore, achievement, completamento medio);
//   2. una sezione con tre grafici (ore per mese, giochi per genere, stati);
//   3. una tabella dei giochi più giocati.
//
// È un client component perché usa hook (i18n) e i grafici Recharts.
// In attesa del backend legge da mockStats; l'aggancio all'endpoint statistiche
// personali (M4-T10) sarà solo la sostituzione di quella sorgente dati.

import { useTranslation } from "react-i18next";
import { Gamepad2, Clock, Trophy, Target } from "lucide-react";

import { Card } from "@/components";
import { KpiCard } from "./KpiCard";
import { Reveal } from "./Reveal";
import { HoursAreaChart } from "./HoursAreaChart";
import { GenreDonut } from "./GenreDonut";
import { StatusBars } from "./StatusBars";
import { TopGamesTable } from "./TopGamesTable";
import { mockStats } from "./mockStats";
import styles from "./statistiche.module.css";

export default function StatistichePage() {
  const { t, i18n } = useTranslation();
  const { totals, monthlyHours, byGenre, byStatus, topGames } = mockStats;

  // Formatta i numeri col separatore delle migliaia della lingua attiva.
  const nf = (n) => new Intl.NumberFormat(i18n.language).format(n);

  return (
    <div className={styles.page}>
      {/* --- Intestazione della pagina ------------------------------------- */}
      <header className={styles.header}>
        <h1 className={styles.title}>{t("pages.statistiche.title")}</h1>
      </header>

      {/* --- 1. Riga di card KPI ------------------------------------------- */}
      <section className={styles.kpiGrid}>
        <KpiCard
          icon={Gamepad2}
          tone="violet"
          label={t("stats.kpi.totalGames")}
          value={nf(totals.games)}
          hint={t("stats.kpi.deltaGames", { count: totals.gamesDelta })}
        />
        <KpiCard
          icon={Clock}
          tone="blue"
          label={t("stats.kpi.hoursPlayed")}
          value={`${nf(totals.hours)}${t("stats.unit.hours")}`}
          hint={t("stats.kpi.deltaHours", { count: totals.hoursDelta })}
        />
        <KpiCard
          icon={Trophy}
          tone="amber"
          label={t("stats.kpi.achievements")}
          value={nf(totals.achievements)}
          hint={t("stats.kpi.deltaAch", { count: totals.achievementsDelta })}
        />
        <KpiCard
          icon={Target}
          tone="green"
          label={t("stats.kpi.avgCompletion")}
          value={`${totals.avgCompletion}%`}
          hint={t("stats.kpi.avgHint", { count: totals.games })}
        />
      </section>

      {/* --- 2. Sezione grafici -------------------------------------------- */}
      <section className={styles.charts}>
        {/* Grafico ore/mese: occupa tutta la larghezza */}
        <Card padding="lg" className={styles.chartWide}>
          <div className={styles.chartHead}>
            <h2 className={styles.chartTitle}>{t("stats.charts.hoursTitle")}</h2>
            <span className={styles.chartHint}>{t("stats.charts.hoursSubtitle")}</span>
          </div>
          <Reveal minHeight={340}>
            <HoursAreaChart data={monthlyHours} />
          </Reveal>
        </Card>

        {/* Torta dei generi */}
        <Card padding="lg">
          <div className={styles.chartHead}>
            <h2 className={styles.chartTitle}>{t("stats.charts.genreTitle")}</h2>
          </div>
          <Reveal minHeight={240}>
            <GenreDonut data={byGenre} />
          </Reveal>
        </Card>

        {/* Barre orizzontali per stato */}
        <Card padding="lg">
          <div className={styles.chartHead}>
            <h2 className={styles.chartTitle}>{t("stats.charts.statusTitle")}</h2>
          </div>
          <Reveal minHeight={240}>
            <StatusBars data={byStatus} />
          </Reveal>
        </Card>
      </section>

      {/* --- 3. Tabella dei giochi più giocati ----------------------------- */}
      <section className={styles.tableSection}>
        <Card padding="lg">
          <div className={styles.chartHead}>
            <h2 className={styles.chartTitle}>{t("stats.table.title")}</h2>
          </div>
          <TopGamesTable games={topGames} />
        </Card>
      </section>
    </div>
  );
}