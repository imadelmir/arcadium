"use client";

// GenreDonut.js
// -----------------------------------------------------------------------------
// Grafico a torta (a ciambella) della distribuzione dei giochi per genere,
// con una legenda a fianco che mostra colore, nome, conteggio e percentuale.
// Usa Recharts (client component per via di ResponsiveContainer).
//
//   <GenreDonut data={mockStats.byGenre} />
//
// data: array di { name: string, count: number }

import { useTranslation } from "react-i18next";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

import { GENRE_PALETTE } from "./mockStats";
import styles from "./charts.module.css";

export function GenreDonut({ data }) {
  const { t } = useTranslation();

  // Totale dei giochi, per calcolare le percentuali nella legenda.
  const total = data.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className={styles.donutLayout}>
      {/* La ciambella */}
      <div className={styles.donutChart}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={104}
              paddingAngle={2}
              stroke="none"
            >
              {/* Un colore per fetta, ciclando sulla palette */}
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={GENRE_PALETTE[i % GENRE_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<GenreTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Numero totale al centro della ciambella */}
        <div className={styles.donutCenter} aria-hidden="true">
          <span className={styles.donutCenterValue}>{total}</span>
          <span className={styles.donutCenterLabel}>{t("stats.unit.games")}</span>
        </div>
      </div>

      {/* Legenda: un rigo per genere */}
      <ul className={styles.legend}>
        {data.map((g, i) => {
          const pct = total > 0 ? Math.round((g.count / total) * 100) : 0;
          return (
            <li key={g.name} className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: GENRE_PALETTE[i % GENRE_PALETTE.length] }}
                aria-hidden="true"
              />
              <span className={styles.legendName}>{g.name}</span>
              <span className={styles.legendValue}>
                {g.count} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Tooltip personalizzato della torta: nome del genere + conteggio e percentuale.
function GenreTooltip({ active, payload, total }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{item.name}</span>
      <span className={styles.tooltipValue}>
        {item.value} · {pct}%
      </span>
    </div>
  );
}