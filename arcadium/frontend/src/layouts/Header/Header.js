"use client";

// =============================================================================
// Header dell'app: barra di ricerca con SUGGERIMENTI live, pulsanti social,
// campanello notifiche (presto disponibile - M4-T13), switch lingua e menu
// utente (profilo + logout).
// =============================================================================

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, LogOut, User as UserIcon, Bell } from "lucide-react";
import { LanguageSwitcher, Avatar, SocialLinks } from "@/components";
import { useAuth } from "@/context/AuthProvider";
import { listGames } from "@/lib/api/games";
import { formatPrice } from "@/lib/format";
import styles from "./Header.module.css";
import suggest from "./HeaderSuggestions.module.css";

export function Header() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Menu utente aperto/chiuso.
  const [menuAperto, setMenuAperto] = useState(false);
  // Popup notifiche (funzione non ancora attiva - M4-T13).
  const [notifOpen, setNotifOpen] = useState(false);
  // Testo digitato nella barra.
  const [ricerca, setRicerca] = useState("");

  // Suggerimenti di ricerca.
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [aperto, setAperto] = useState(false);
  const boxRef = useRef(null);

  // Nome mostrato: displayName se c'è, altrimenti username; fallback neutro.
  const nome = user?.displayName || user?.username || "Utente";

  // Logout: cancella sessione e torna al login.
  function esci() {
    logout();
    setMenuAperto(false);
    router.push("/login");
  }

  // Invio della ricerca: va al Negozio con ?q=... e chiude i suggerimenti.
  function cerca(e) {
    e.preventDefault();
    const q = ricerca.trim();
    setAperto(false);
    router.push(q ? `/negozio?q=${encodeURIComponent(q)}` : "/negozio");
  }

  // Chiede i suggerimenti al backend mentre si digita (debounce 150ms).
  useEffect(() => {
    const q = ricerca.trim();
    if (q.length < 1) {
      setSuggerimenti([]);
      setAperto(false);
      return;
    }
    const id = setTimeout(() => {
      listGames({ q, page: 0, size: 6 })
        .then((res) => {
          setSuggerimenti(res.content);
          setAperto(true);
        })
        .catch(() => {
          setSuggerimenti([]);
          setAperto(false);
        });
    }, 150);
    return () => clearTimeout(id);
  }, [ricerca]);

  // Chiude la tendina dei suggerimenti quando si clicca fuori dalla barra.
  useEffect(() => {
    function onClickFuori(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setAperto(false);
    }
    document.addEventListener("mousedown", onClickFuori);
    return () => document.removeEventListener("mousedown", onClickFuori);
  }, []);

  // Va al dettaglio di un gioco suggerito e pulisce la barra.
  function vaiAlGioco(appId) {
    setAperto(false);
    setRicerca("");
    router.push(`/gioco/${appId}`);
  }

  return (
    <header className={styles.header}>
      {/* Barra di ricerca con tendina suggerimenti ancorata dentro */}
      <form className={styles.searchBox} onSubmit={cerca} role="search" ref={boxRef}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder={t("common.search")}
          aria-label={t("common.search")}
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          onFocus={() => suggerimenti.length > 0 && setAperto(true)}
          autoComplete="off"
        />

        {aperto && (
          <ul className={suggest.suggestList}>
            {suggerimenti.length === 0 ? (
              <li className={suggest.suggestEmpty}>{t("store.noResults")}</li>
            ) : (
              suggerimenti.map((g) => {
                const p = formatPrice(g.price, g.discount, i18n.language);
                return (
                  <li key={g.appId}>
                    <button
                      type="button"
                      className={suggest.suggestItem}
                      onClick={() => vaiAlGioco(g.appId)}
                    >
                      <img className={suggest.suggestThumb} src={g.headerImage} alt="" loading="lazy" />
                      <span className={suggest.suggestText}>
                        <span className={suggest.suggestName}>{g.name}</span>
                        <span className={suggest.suggestGenre}>
                          {p.isFree ? t("store.free") : p.final}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </form>

      {/* Pulsanti social (Discord / Twitch) */}
      <SocialLinks />

      

      {/* Azioni a destra: switch lingua + menu utente */}
      <div className={styles.actions}>
        <LanguageSwitcher />

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
                {i18n.language === "en" ? "My profile" : "Il mio profilo"}
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