"use client";

import { useTranslation } from "react-i18next";
import { BACKLOG_STATUS_BY_CODE } from "@/lib/constants";
import styles from "./StatusBadge.module.css";

// StatusBadge
// -----------------------------------------------------------------------------
// La pillola colorata dello stato mostrata su ogni gioco in libreria e backlog.
// Gli si passa il CODICE stato del DB/backend e stampa l'etichetta tradotta e
// il colore giusto, così i quattro stati restano coerenti in tutta l'app.
//
//   <StatusBadge status="in_corso" />   ->  • In corso   (IT) / • Playing (EN)
//   <StatusBadge status="finito" />     ->  • Finito     (IT) / • Completed (EN)
//
// I codici sono quelli reali del DB (seed backlog_status): non usare valori
// inglesi tipo "playing". La mappa codice->colore/etichetta è in lib/constants.js.
//
// status: "mai_giocato" | "in_corso" | "finito" | "abbandonato"
//
// `label` opzionale: se il backend ti passa già l'etichetta (labelIt/labelEn di
// BacklogStatusResponse), puoi darla qui e ha la precedenza sulla traduzione.

// Riesportata per retrocompatibilità con chi importava GAME_STATUSES da qui.
// Ora la fonte è unica: lib/constants.js.
export { BACKLOG_STATUS_BY_CODE as GAME_STATUSES };

export function StatusBadge({ status = "mai_giocato", label, className = "", ...rest }) {
  const { t } = useTranslation();

  // Config dello stato (con fallback a "mai_giocato" se il codice è sconosciuto).
  const config = BACKLOG_STATUS_BY_CODE[status] ?? BACKLOG_STATUS_BY_CODE.mai_giocato;

  // Etichetta: quella passata dal backend ha la precedenza, altrimenti si traduce.
  const text = label ?? t(config.labelKey);

  const classes = [styles.badge, styles[config.cssClass], className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      <span className={styles.dot} aria-hidden="true" />
      {text}
    </span>
  );
}
