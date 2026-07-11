"use client";

// Header in alto: barra di ricerca a sinistra, pulsanti social (Discord/Twitch),
// switch lingua e blocco utente a destra.
// Il nome utente NON è più fisso ("Luca"): ora arriva dalla sessione (useAuth).
// Cliccando sull'utente si apre un piccolo menu con il logout.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, LogOut } from "lucide-react";
import { LanguageSwitcher, Avatar, SocialLinks } from "@/components";
import { useAuth } from "@/context/AuthProvider";
import styles from "./Header.module.css";

export function Header() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Stato locale del menuutente (aperto/chiuso).
  const [menuAperto, setMenuAperto] = useState(false);

  // Nome mostrato: displayName se c'è, altrimenti lo username; fallback neutro.
  const nome = user?.displayName || user?.username || "Utente";

  function esci() {
    logout();
    setMenuAperto(false);
    router.push("/login"); // torna al login dopo il logout
  }

  return (
    <header className={styles.header}>
      <div className={styles.searchBox}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder={t("common.search")}
          aria-label={t("common.search")}
        />
      </div>

      <SocialLinks />

      <div className={styles.actions}>
        <LanguageSwitcher />

        {/* Blocco utente + menu logout. position:relative per ancorare il menu. */}
        <div style={{ position: "relative" }}>
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
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                minWidth: 180,
                background: "var(--surface-2, #1a2138)",
                border: "1px solid var(--border, #232b44)",
                borderRadius: "var(--radius-md, 10px)",
                boxShadow: "0 12px 32px rgba(0,0,0,.45)",
                padding: 6,
                zIndex: 50,
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={esci}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "var(--radius-sm, 8px)",
                  color: "var(--text, #e7e9f2)",
                  font: "inherit",
                  cursor: "pointer",
                  textAlign: "left",
                }}
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
