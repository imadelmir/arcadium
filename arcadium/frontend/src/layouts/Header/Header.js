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
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Menu utente aperto/chiuso.
  const [menuAperto, setMenuAperto] = useState(false);

  // Nome mostrato: displayName se c'è, altrimenti username; fallback neutro.
  const nome = user?.displayName || user?.username || "Utente";

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
            data-open={menuAperto}
            onClick={() => setMenuAperto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuAperto}
          >
            <Avatar name={nome} src={user?.avatarUrl} size="md" />
            <span className={styles.userName}>{nome}</span>
            <ChevronDown size={16} className={styles.chevron} />
          </button>

          {menuAperto && (
            <div role="menu" className={styles.menu}>
              <Link
                href={`/profilo/${encodeURIComponent(user?.username || "")}`}
                role="menuitem"
                className={styles.menuItem}
                onClick={() => setMenuAperto(false)}
              >
                <UserIcon size={16} />
                {t("common.myProfile")}
              </Link>

              <hr className={styles.menuDivider} />

              <button
                type="button"
                role="menuitem"
                onClick={esci}
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
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
