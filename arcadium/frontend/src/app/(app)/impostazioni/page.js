"use client";

// =============================================================================
// Pagina Impostazioni (/impostazioni) — M5-T15.
// Sezioni: nome utente (UsernamePanel), immagine del profilo (AvatarPanel),
// privacy del profilo (ProfilePanel), safe search (SafeSearchPanel),
// auto-abbandono (AutoAbandonPanel, feature M6) e integrazione Steam (SteamPanel).
//
// M6: le card sono avvolte in un contenitore flex con gap uniforme, cosi' la
// distanza tra i pannelli e' identica (prima dipendeva da margini per-pannello
// incoerenti). I singoli pannelli non hanno margini propri.
// =============================================================================

import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ProfilePanel } from "./ProfilePanel";
import { UsernamePanel } from "./UsernamePanel";
import { AvatarPanel } from "./AvatarPanel";
import { SafeSearchPanel } from "./SafeSearchPanel";
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

      {/* Area che scorre: la testata sopra resta FUORI, quindi nessuna card le
          passa dietro e puo' restare trasparente (l'effetto animato di sfondo
          resta visibile come prima). */}
      <div className={styles.scrollArea}>

      {/* Contenitore dei pannelli: gap uniforme tra tutte le card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
          marginTop: "var(--space-5)",
        }}
      >
        {/* Nome utente (V16): cambio username, una volta ogni 2 mesi. */}
        <UsernamePanel />

        {/* Immagine del profilo (change request avatar): 6 preset, no upload. */}
        <AvatarPanel />

        {/* Privacy del profilo (change request privacy): pubblico / privato. */}
        <ProfilePanel />

        {/* Safe search (change request, V18): filtro contenuti per adulti nel
            Negozio. Accostato alla privacy perche' e' l'altra impostazione che
            decide cosa si vede e cosa no. */}
        <SafeSearchPanel />

        {/* Auto-abbandono (feature M6): timeout 1/3/6 mesi o spento. */}
        <AutoAbandonPanel />

        {/* Integrazione Steam (M5-T15). Suspense: SteamPanel legge ?steam= con
            useSearchParams e Next lo esige per non bloccare il prerender. */}
        <Suspense fallback={null}>
          <SteamPanel />
        </Suspense>
      </div>
      </div>
    </section>
  );
}
