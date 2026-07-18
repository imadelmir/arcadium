"use client";

// =============================================================================
// Header dell'app: barra di AZIONI allineata a destra.
//
// Change request Negozio: la barra di ricerca dell'header è stata RIMOSSA — la
// ricerca vive nella pagina Negozio (una sola barra, sotto il titolo). Con la
// navigazione già affidata alla sidebar a sinistra, l'header segue lo schema
// degli store/piattaforme moderni: un cluster di azioni a destra —
// community (Discord/Twitch) + campanello notifiche, poi lingua, poi profilo.
// Il campanello vive dentro SocialLinks, insieme ai social.
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { LanguageSwitcher, Avatar, SocialLinks } from "@/components";
import { useAuth } from "@/context/AuthProvider";
import styles from "./Header.module.css";

export function Header() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Menu utente aperto/chiuso.
  const [menuAperto, setMenuAperto] = useState(false);

  // Nome mostrato: SEMPRE lo username corrente (il nome visualizzato coincide
  // con lo username e cambiando nome deve aggiornarsi ovunque); fallback neutro.
  const nome = user?.username || "Utente";

  // Logout: cancella sessione e torna al login.
  function esci() {
    logout();
    setMenuAperto(false);
    router.push("/login");
  }

  return (
    <header className={styles.header}>
      {/* Cluster di azioni allineato a destra. Ordine ispirato agli store
          moderni con sidebar di navigazione: community + notifiche, lingua,
          separatore, profilo. */}
      <div className={styles.actions}>
        {/* Discord / Twitch / campanello notifiche */}
        <SocialLinks />

        <LanguageSwitcher />

        {/* Separatore sottile fra le azioni "di sistema" e il profilo */}
        <span className={styles.divider} aria-hidden="true" />

        <div className={styles.userWrap}>
          <button
            type="button"
            className={styles.user}
            onClick={() => setMenuAperto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuAperto}
          >
            <Avatar name={nome} src={user?.avatarUrl} size="md" />
            <span className={styles.userName}>{nome}</span>
            <ChevronDown size={16} className={styles.chevron} />
          </button>

          {menuAperto && (
            <div
              role="menu"
              style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)", minWidth: 180,
                background: "var(--surface-2, #1a2138)", border: "1px solid var(--border, #232b44)",
                borderRadius: "var(--radius-md, 10px)", boxShadow: "0 12px 32px rgba(0,0,0,.45)",
                padding: 6, zIndex: 50,
              }}
            >
              <Link
                href={`/profilo/${encodeURIComponent(user?.username || "")}`}
                role="menuitem"
                onClick={() => setMenuAperto(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm, 8px)", color: "var(--text, #e7e9f2)", textDecoration: "none" }}
              >
                <UserIcon size={16} />
                {t("header.myProfile")}
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={esci}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", background: "transparent", border: "none", borderRadius: "var(--radius-sm, 8px)", color: "var(--text, #e7e9f2)", font: "inherit", cursor: "pointer", textAlign: "left" }}
              >
                <LogOut size={16} />
                {t("common.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
