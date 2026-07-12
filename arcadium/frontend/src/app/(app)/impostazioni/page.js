"use client";

// =============================================================================
// Pagina Impostazioni (/impostazioni) — M5-T15.
// Per ora contiene la sezione "Integrazione Steam" (SteamPanel): connessione
// dell'account Steam, sincronizzazione libreria/ore e gestione profilo privato.
// In futuro qui si aggiungeranno profilo, lingua e altre preferenze.
// =============================================================================

import { useTranslation } from "react-i18next";
import { SteamPanel } from "./SteamPanel";
import styles from "../placeholder.module.css";

export default function ImpostazioniPage() {
  const { t } = useTranslation();

  return (
    <section className={styles.page}>
      {/* Intestazione della pagina */}
      <h1 className={styles.title}>{t("pages.impostazioni.title")}</h1>
      <p className={styles.subtitle}>{t("pages.impostazioni.subtitle")}</p>

      {/* Sezione integrazione Steam (M5-T15) */}
      <SteamPanel />
    </section>
  );
}