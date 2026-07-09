"use client";

// HoursAreaChart.js
// -----------------------------------------------------------------------------
// Grafico ad area (basato su una linea) delle ore giocate negli ultimi 12 mesi.
// Usa Recharts. È un client component perché Recharts misura la larghezza del
// contenitore dopo il mount (ResponsiveContainer).
//
//   <HoursAreaChart data={mockStats.monthlyHours} />
//
// data: array di { m: indiceMese(0-11), hours: numero }

import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { CHART } from "./mockStats";
import styles from "./charts.module.css";

export function HoursAreaChart({ data }) {
  const { t } = useTranslation();

  // Etichette dei mesi tradotte (array IT/EN preso dall'i18n).
  const months = t("stats.months", { returnObjects: true });

  // Prepariamo i dati con l'etichetta del mese già tradotta per l'asse X.
  const chartData = data.map((d) => ({
    ...d,
    label: months[d.m] ?? "",
  }));

  return (
    <div className={styles.chartBody}>
      {/* ResponsiveContainer riempie la larghezza; l'altezza è fissa */}
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          {/* Gradiente viola per il riempimento sotto la linea */}
          <defs>
            <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.violet} stopOpacity={0.45} />
              <stop offset="100%" stopColor={CHART.violet} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Griglia orizzontale sottile, in tinta con i bordi dell'app */}
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="label"
            tick={{ fill: CHART.text, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: CHART.grid }}
          />
          <YAxis
            tick={{ fill: CHART.text, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />

          {/* Tooltip con aspetto personalizzato (vedi funzione sotto) */}
          <Tooltip
            cursor={{ stroke: CHART.violet, strokeWidth: 1, strokeOpacity: 0.4 }}
            content={<HoursTooltip unit={t("stats.tooltip.hours")} />}
          />

          <Area
            type="monotone"
            dataKey="hours"
            stroke={CHART.violet}
            strokeWidth={2.5}
            fill="url(#hoursGradient)"
            dot={false}
            activeDot={{ r: 5, fill: CHART.violet, stroke: "#0e1025", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Tooltip personalizzato: mostra il mese e le ore in un box scuro coerente col tema.
function HoursTooltip({ active, payload, label, unit }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{label}</span>
      <span className={styles.tooltipValue}>
        {payload[0].value} {unit}
      </span>
    </div>
  );
}