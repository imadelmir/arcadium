"use client";

// =============================================================================
// Pagina Impostazioni (/impostazioni) — M5-T15.
// Sezioni: privacy del profilo (ProfilePanel), auto-abbandono (AutoAbandonPanel,
// feature M6) e integrazione Steam (SteamPanel).
// =============================================================================

import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ProfilePanel } from "./ProfilePanel";
import { AutoAbandonPanel } from "./AutoAbandonPanel";
import { SteamPanel } from "./SteamPanel";
import styles from "../placeholder.module.css";

export default function ImpostazioniPage() {
  const { t } = useTranslation();

  return (
    <section className={styles.page}>
      {/* Intestazione della pagina */}
      <h1 className={styles.title}>{t("pages.impostazioni.title")}</h1>
      <p className={styles.subtitle}>{t("pages.impostazioni.subtitle")}</p>

      {/* Privacy del profilo (change request privacy): pubblico / privato. */}
      <ProfilePanel />

      {/* Auto-abbandono (feature M6): timeout 1/3/6 mesi o spento. */}
      <AutoAbandonPanel />

      {/* Sezione integrazione Steam (M5-T15).
          Suspense: SteamPanel legge ?steam= con useSearchParams e Next lo esige
          per non bloccare il prerender della pagina (M6-T4). */}
      <Suspense fallback={null}>
        <SteamPanel />
      </Suspense>
    </section>
  );
}
