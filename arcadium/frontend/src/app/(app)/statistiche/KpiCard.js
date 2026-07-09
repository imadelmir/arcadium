// KpiCard.js
// -----------------------------------------------------------------------------
// Una singola card KPI della riga in cima alla pagina Statistiche.
// Mostra: un'icona in tinta, l'etichetta, il valore grande e una riga di
// contesto (es. "+12 questo mese"). È un componente "muto": riceve tutto via
// props e non conosce i dati, così lo riusiamo per tutti e quattro i KPI.
//
//   <KpiCard icon={Gamepad2} label="Giochi totali" value="142" hint="+12 questo mese" />
//
// tone: "violet" (default) | "blue" | "green" | "amber"  -> colore di icona/tinta

import { Card } from "@/components";
import styles from "./KpiCard.module.css";

export function KpiCard({ icon: Icon, label, value, hint, tone = "violet" }) {
  return (
    <Card className={styles.kpi} data-tone={tone}>
      {/* Icona in alto a destra, colorata in base al "tone" */}
      <span className={styles.iconWrap} aria-hidden="true">
        {Icon && <Icon className={styles.icon} size={20} />}
      </span>

      {/* Etichetta + valore grande */}
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>

      {/* Riga di contesto opzionale (variazione mensile, media, ecc.) */}
      {hint && <p className={styles.hint}>{hint}</p>}
    </Card>
  );
}