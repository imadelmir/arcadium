"use client";

// TopGamesBars.js
// -----------------------------------------------------------------------------
// Grafico a barre ORIZZONTALI dei giochi piu' giocati, in ore.
//
//   <TopGamesBars data={stats.topGames} />
//
// data: la serie `topGames` di GET /api/stats/me, ossia un array di
//       { appId, name, headerImage, minutes, hours } gia' ordinato dal piu'
//       giocato (al massimo 10 voci).
//
// PERCHE' ESISTE. Con Steam collegato il grafico "ore per mese" e' per forza
// piatto: GetOwnedGames restituisce `playtime_forever`, il totale di sempre per
// gioco, senza alcuna data. Non esiste un mese a cui attribuire quelle ore, e
// spalmarle sul mese dell'ultima sessione darebbe un grafico verosimile ma
// falso. Le ore per gioco sono invece esattamente cio' che il dato contiene: si
// mostra come il tempo si distribuisce fra i titoli, non quando e' stato speso.
//
// Il backend indica con `playtimeSource` quale grafico ha senso mostrare, cosi'
// la scelta sta dove si conosce la provenienza del dato (vedi statistiche/page).

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

import { CHART } from "./chartColors";
import styles from "./charts.module.css";

// Altezza per barra: il grafico cresce col numero di giochi invece di
// comprimerli, cosi' le etichette restano leggibili anche con dieci titoli.
const ROW_HEIGHT = 34;
const MIN_HEIGHT = 200;

// Sfumatura viola->ciano lungo la classifica: il primo gioco e' il piu' acceso,
// gli ultimi sfumano. Nessun significato nascosto, serve solo a dare ordine.
function barColor(index, total) {
  const ratio = total <= 1 ? 0 : index / (total - 1);
  const hue = 258 - ratio * 68; // 258 = viola del tema, 190 = ciano
  return `hsl(${Math.round(hue)}, 72%, 62%)`;
}

// Nomi lunghi troncati sull'asse: "Sid Meier's Civilization VI" -> "Sid Meier's…"
function shorten(name, max = 22) {
  const value = name ?? "";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

// Minuti -> ore, con la STESSA regola della riga del Backlog (un decimale sotto
// le 10 ore, poi interi). Il campo `hours` che arriva dall'API e' una divisione
// intera: 95 minuti diventano "1", mentre nel Backlog lo stesso gioco mostra
// "1,6 h". Due schermate che dichiarano numeri diversi per lo stesso dato sono
// un errore, non un arrotondamento — quindi qui si riparte dai minuti.
function toHours(minutes) {
  const hours = (minutes ?? 0) / 60;
  return hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
}

function TopGamesTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{row.name}</p>
      <p className={styles.tooltipValue}>
        {row.hours.toLocaleString("it-IT")} {unit}
      </p>
    </div>
  );
}

export function TopGamesBars({ data }) {
  const { t } = useTranslation();

  const rows = data ?? [];

  // Nessun gioco con ore registrate: meglio un messaggio di un grafico vuoto.
  if (rows.length === 0) {
    return <p className={styles.emptyChart}>{t("stats.charts.topGamesEmpty")}</p>;
  }

  const chartData = rows.map((game) => ({
    appId: game.appId,
    name: game.name,
    hours: toHours(game.minutes),
    label: shorten(game.name),
  }));

  const height = Math.max(MIN_HEIGHT, chartData.length * ROW_HEIGHT);

  return (
    <div className={styles.chartBody}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 44, left: 8, bottom: 4 }}
          barCategoryGap={10}
        >
          {/* Asse X numerico nascosto: conta solo la lunghezza delle barre */}
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: CHART.text, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={150}
          />

          <Tooltip
            cursor={{ fill: "rgba(124, 92, 255, 0.08)" }}
            content={<TopGamesTooltip unit={t("stats.tooltip.hours")} />}
          />

          <Bar dataKey="hours" radius={[0, 6, 6, 0]} barSize={18}>
            {chartData.map((entry, index) => (
              <Cell key={entry.appId} fill={barColor(index, chartData.length)} />
            ))}
            {/* Ore stampate in fondo a ogni barra */}
            <LabelList
              dataKey="hours"
              position="right"
              // Stesso formato locale del Backlog: "1,6" e non "1.6"
              formatter={(value) => value.toLocaleString("it-IT")}
              fill={CHART.text}
              fontSize={12}
              fontWeight={700}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
