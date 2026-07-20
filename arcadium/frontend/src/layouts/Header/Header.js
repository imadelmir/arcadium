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
//
// Change request responsive: sotto i 768px compare a SINISTRA il pulsante che
// apre la sidebar a scomparsa (l'header e' l'unico punto fermo a schermo quando
// la sidebar e' fuori campo). Lo stato del pannello non sta qui ma in AppShell,
// che lo condivide con sidebar e velatura: l'header riceve solo il valore e la
// funzione per invertirlo.
// =============================================================================

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { LanguageSwitcher, Avatar, SocialLinks } from "@/components";
import { useAuth } from "@/context/AuthProvider";
import styles from "./Header.module.css";

// `sidebarAperta`/`onToggleSidebar` riguardano la SIDEBAR a scomparsa (mobile),
// da non confondere con `menuAperto` qui sotto, che e' il menu a tendina del
// profilo: due pannelli diversi, stato separato.
export function Header({ sidebarAperta = false, onToggleSidebar }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Menu utente aperto/chiuso.
  const [menuAperto, setMenuAperto] = useState(false);

  // Uscita in corso: durante il logout "congeliamo" nome e avatar mostrati.
  // Perche': l'header vive FUORI da RequireAuth (resta sempre a schermo mentre
  // si e' nell'app), quindi appena logout() azzera la sessione l'header si
  // ri-renderizza con user=null e mostrerebbe per un istante l'avatar di
  // ripiego (le iniziali) prima che il redirect a /login lo smonti del tutto.
  // Congelando l'ultimo valore noto, l'immagine scelta resta visibile fino
  // all'uscita, invece del "lampo" dell'icona di ripiego.
  const [uscendo, setUscendo] = useState(false);
  const ultimoProfilo = useRef({ nome: "Utente", src: undefined });
  if (user) {
    ultimoProfilo.current = { nome: user.username || "Utente", src: user.avatarUrl };
  }

  // Nome e avatar mostrati: durante l'uscita si usa l'ultimo valore congelato,
  // altrimenti lo username corrente (il nome visualizzato coincide con lo
  // username e cambiando nome deve aggiornarsi ovunque); fallback neutro.
  const nome = uscendo ? ultimoProfilo.current.nome : user?.username || "Utente";
  const avatarSrc = uscendo ? ultimoProfilo.current.src : user?.avatarUrl;

  // Logout: congela l'avatar, cancella sessione e torna al login.
  function esci() {
    setUscendo(true);
    setMenuAperto(false);
    logout();
    router.push("/login");
  }

  return (
    <header className={styles.header}>
      {/* Apertura della sidebar: visibile SOLO sotto i 768px (display:none
          altrove). Sta per primo nel DOM oltre che a sinistra, cosi' e' anche
          il primo elemento raggiunto da tastiera. */}
      <button
        type="button"
        className={styles.menuButton}
        onClick={onToggleSidebar}
        aria-expanded={sidebarAperta}
        aria-label={t(sidebarAperta ? "nav.closeMenu" : "nav.openMenu")}
      >
        {sidebarAperta ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Cluster di azioni allineato a destra. Ordine ispirato agli store
          moderni con sidebar di navigazione: community + notifiche, lingua,
          separatore, profilo. */}
      <div className={styles.actions}>
        {/* Discord / Twitch / campanello notifiche. Su schermi molto stretti
            sparisce: sono scorciatoie esterne, mentre lingua e profilo servono
            per usare l'app. */}
        <span className={styles.socials}>
          <SocialLinks />
        </span>

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
            <Avatar name={nome} src={avatarSrc} size="md" />
            {/* Su telefono resta il solo avatar: il nome mangia larghezza e
                l'identita' e' gia' chiara dall'immagine. */}
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