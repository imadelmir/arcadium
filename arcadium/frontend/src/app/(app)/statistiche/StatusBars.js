"use client";

// StatusBars.js
// -----------------------------------------------------------------------------
// Grafico a barre ORIZZONTALI della distribuzione dei giochi per stato di
// completamento: Completati, In corso, Non iniziati, Backlog.
// Usa Recharts con layout "vertical" (barre orizzontali). Client component.
//
//   <StatusBars data={mockStats.byStatus} />
//
// data: array di { key: "completed"|"playing"|"notStarted"|"backlog", count }

import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  Tooltip,
} from "recharts";

import { STATUS_COLORS, CHART } from "./chartColors";
import styles from "./charts.module.css";

export function StatusBars({ data }) {
  const { t } = useTranslation();

  // Aggiungiamo l'etichetta tradotta a ogni voce (per l'asse Y).
  const chartData = data.map((d) => ({
    ...d,
    label: d.label ?? t(`stats.status.${d.key}`),
  }));

  return (
    <div className={styles.chartBody}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 28, left: 8, bottom: 4 }}
          barCategoryGap={18}
        >
          {/* Asse X numerico nascosto: conta solo la lunghezza delle barre */}
          <XAxis type="number" hide />
          {/* Asse Y con le etichette di stato tradotte */}
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: CHART.text, fontSize: 13 }}
            tickLine={false}
            axisLine={false}
            width={92}
          />

          <Tooltip
            cursor={{ fill: "rgba(124, 92, 255, 0.08)" }}
            content={<StatusTooltip unit={t("stats.tooltip.games")} />}
          />

          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
            {/* Ogni barra prende il colore del suo stato */}
            {chartData.map((entry) => (
              <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
            ))}
            {/* Numero di giochi stampato in fondo a ogni barra */}
            <LabelList
              dataKey="count"
              position="right"
              fill={CHART.text}
              fontSize={13}
              fontWeight={700}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Tooltip personalizzato: stato + numero di giochi.
function StatusTooltip({ active, payload, unit }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{item.label}</span>
      <span className={styles.tooltipValue}>
        {item.count} {unit}
      </span>
    </div>
  );
}