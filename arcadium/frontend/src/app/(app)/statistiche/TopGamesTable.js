"use client";

// TopGamesTable.js
// -----------------------------------------------------------------------------
// Tabella dei giochi più giocati dall'utente (classifica per ore decrescenti).
// Colonne: posizione, copertina, gioco (nome + genere), ore, progresso
// achievement, stato. Riusa GameImage (copertina con fallback) e StatusBadge
// (pillola di stato coerente con libreria e backlog).
//
//   <TopGamesTable games={mockStats.topGames} />
//
// games: array come definito in mockStats.topGames

import { useTranslation } from "react-i18next";
import { GameImage, StatusBadge } from "@/components";
import styles from "./TopGamesTable.module.css";

export function TopGamesTable({ games }) {
  const { t, i18n } = useTranslation();

  // Formatta i numeri col separatore delle migliaia della lingua attiva
  // (es. 1.204 in italiano, 1,204 in inglese).
  const nf = (n) => new Intl.NumberFormat(i18n.language).format(n);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        {/* Larghezze fisse delle colonne: colonne pulite e sempre allineate */}
        <colgroup>
          <col className={styles.colRank} />
          <col className={styles.colCover} />
          <col className={styles.colGame} />
          <col className={styles.colHours} />
          <col className={styles.colAch} />
          <col className={styles.colStatus} />
        </colgroup>

        {/* Intestazione con i nomi delle colonne (tradotti) */}
        <thead>
          <tr>
            <th aria-hidden="true" />
            <th className={styles.thGame} colSpan={2}>
              {t("stats.table.game")}
            </th>
            <th className={styles.thNum}>{t("stats.table.hours")}</th>
            <th>{t("stats.table.progress")}</th>
            <th>{t("stats.table.status")}</th>
          </tr>
        </thead>

        <tbody>
          {games.map((game, index) => {
            // Percentuale di completamento achievement (0 se il gioco non ne ha).
            const pct =
              game.achTotal > 0 ? Math.round((game.achUnlocked / game.achTotal) * 100) : 0;

            return (
              <tr key={game.id} className={styles.row}>
                {/* Posizione in classifica (#1, #2, …) */}
                <td className={styles.rankCell}>
                  <span className={styles.rank}>{index + 1}</span>
                </td>

                {/* Copertina: contenitore a dimensione fissa, GameImage lo riempie */}
                <td className={styles.coverCell}>
                  <div className={styles.cover}>
                    <GameImage src={game.headerImage} alt={game.name} />
                  </div>
                </td>

                {/* Gioco: nome + genere come sottotitolo */}
                <td className={styles.gameCell}>
                  <span className={styles.name} title={game.name}>
                    {game.name}
                  </span>
                  {game.genre && <span className={styles.genre}>{game.genre}</span>}
                </td>

                {/* Ore giocate */}
                <td className={styles.hoursCell}>
                  {nf(game.hours)}
                  {t("stats.unit.hours")}
                </td>

                {/* Progresso achievement: frazione + % sopra, barra sotto */}
                <td className={styles.achCell}>
                  {game.achTotal > 0 ? (
                    <div className={styles.ach}>
                      <div className={styles.achTop}>
                        <span className={styles.achFraction}>
                          {game.achUnlocked}/{game.achTotal}
                        </span>
                        <span className={styles.achPct}>{pct}%</span>
                      </div>
                      <div className={styles.track}>
                        <div className={styles.fill} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ) : (
                    // Trattino se il gioco non prevede achievement
                    <span className={styles.noAch}>—</span>
                  )}
                </td>

                {/* Stato: stessa pillola usata in libreria e backlog */}
                <td className={styles.statusCell}>
                  <StatusBadge status={game.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}