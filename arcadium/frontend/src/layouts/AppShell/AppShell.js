"use client";

// =============================================================================
// AppShell — impalcatura del gruppo autenticato (change request responsive).
// -----------------------------------------------------------------------------
// Prima questa struttura viveva come stili inline dentro app/(app)/layout.js,
// che e' un componente server: andava bene finche' il layout era fisso, ma la
// sidebar a scomparsa su telefono ha bisogno di STATO (aperta/chiusa), quindi
// serve un componente client. layout.js resta server e monta questo.
//
// Tre configurazioni, gestite dai media query dei fogli di stile:
//   - desktop (> 1024px) : sidebar larga con etichette, sempre visibile;
//   - tablet  (769-1024) : sidebar stretta a sole icone, sempre visibile;
//   - telefono (<= 768px): sidebar fuori schermo, si apre come pannello
//                          laterale dal pulsante nell'header.
//
// Lo stato vive qui e non nella Sidebar perche' serve a tre componenti: la
// sidebar (per scorrere dentro/fuori), l'header (per lo stato del pulsante) e
// la velatura che chiude il pannello al tocco.
// =============================================================================

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Sidebar } from "@/layouts/Sidebar/Sidebar";
import { Header } from "@/layouts/Header/Header";
import { RequireAuth } from "@/layouts/RequireAuth/RequireAuth";
import styles from "./AppShell.module.css";

export function AppShell({ children }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  // Solo su telefono ha effetto: sulle altre misure la sidebar e' sempre a
  // schermo e i media query ignorano questo stato.
  const [menuAperto, setMenuAperto] = useState(false);

  // Cambio pagina = pannello chiuso. Senza, toccando una voce del menu si
  // navigherebbe restando con il pannello aperto sopra il contenuto nuovo.
  useEffect(() => {
    setMenuAperto(false);
  }, [pathname]);

  // Tasto Esc: stessa uscita di sicurezza di qualunque pannello modale.
  useEffect(() => {
    if (!menuAperto) return undefined;
    const alTasto = (e) => {
      if (e.key === "Escape") setMenuAperto(false);
    };
    window.addEventListener("keydown", alTasto);
    return () => window.removeEventListener("keydown", alTasto);
  }, [menuAperto]);

  return (
    <div className={styles.shell} data-menu-open={menuAperto}>
      <Sidebar open={menuAperto} />

      {/* Velatura sotto il pannello: intercetta il tocco e lo chiude. Esiste
          solo sotto i 768px (display:none altrove), quindi non intercetta mai
          nulla su desktop. */}
      <button
        type="button"
        className={styles.overlay}
        tabIndex={menuAperto ? 0 : -1}
        aria-hidden={!menuAperto}
        aria-label={t("nav.closeMenu")}
        onClick={() => setMenuAperto(false)}
      />

      <div className={styles.column}>
        <Header sidebarAperta={menuAperto} onToggleSidebar={() => setMenuAperto((v) => !v)} />

        {/* Nessun padding in alto: le testate delle pagine partono a filo,
            altrimenti il contenuto scorrerebbe visibile nella striscia sopra. */}
        <main className={styles.main}>
          <RequireAuth>{children}</RequireAuth>
        </main>
      </div>
    </div>
  );
}
