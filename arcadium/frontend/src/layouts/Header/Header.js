"use client";

// Header dell'app-shell (M5 - T4) con ricerca + autocompletamento (M5 - T9).
// -----------------------------------------------------------------------------
// La barra grande e' la ricerca ufficiale del catalogo e funziona da qualsiasi
// pagina:
//   - mentre digiti compare un menu di SUGGERIMENTI (i giochi il cui titolo
//     contiene il testo); cliccandone uno vai alla sua pagina di dettaglio;
//   - premendo Invio senza selezionare nulla vai al Negozio filtrato
//     (/negozio?q=...);
//   - se sei gia' nel Negozio, i risultati si aggiornano mentre digiti.
// Tastiera: frecce su/giu' per scorrere, Invio per aprire, Esc per chiudere.
//
// NB: gli stili del menu stanno in HeaderSuggestions.module.css (file separato),
// cosi' Header.module.css resta intatto. La posizione relativa della barra e'
// impostata inline sul <form>, per non dover modificare Header.module.css.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search, ChevronDown } from "lucide-react";

import { LanguageSwitcher, Avatar, SocialLinks, NotificationButton } from "@/components";
import { STORE_GAMES } from "@/app/(app)/negozio/mockGames";
import styles from "./Header.module.css";
import sugg from "./HeaderSuggestions.module.css";

const STORE_PATH = "/negozio";
const MAX_SUGGESTIONS = 6;

// URL del negozio con (o senza) parametro di ricerca ?q=.
function storeUrl(term) {
  const q = term.trim();
  return q ? `${STORE_PATH}?q=${encodeURIComponent(q)}` : STORE_PATH;
}

// Copertina piccola del gioco dalla CDN di Steam.
const coverUrl = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

export function Header() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const [value, setValue] = useState("");   // testo digitato
  const [open, setOpen] = useState(false);  // menu suggerimenti aperto?
  const [active, setActive] = useState(-1); // indice evidenziato (-1 = nessuno)

  const boxRef = useRef(null); // per chiudere il menu cliccando fuori

  // Pre-compila la barra se l'URL contiene gia' ?q= (es. link condiviso).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setValue(q);
  }, []);

  // Chiude il menu quando si clicca fuori dalla barra.
  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Suggerimenti: titoli che contengono il testo, con quelli che INIZIANO per
  // il testo digitato messi per primi. Ricalcola solo al cambio del testo.
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return STORE_GAMES
      .map((g) => ({ game: g, pos: g.name.toLowerCase().indexOf(q) }))
      .filter((x) => x.pos !== -1)
      .sort((a, b) => a.pos - b.pos || a.game.name.localeCompare(b.game.name, "it"))
      .slice(0, MAX_SUGGESTIONS)
      .map((x) => x.game);
  }, [value]);

  // Aggiorna il campo; se sono nel negozio filtro anche i risultati in tempo
  // reale; riapro il menu e azzero l'evidenziazione.
  const handleChange = (e) => {
    const next = e.target.value;
    setValue(next);
    setActive(-1);
    setOpen(true);
    if (pathname === STORE_PATH) router.replace(storeUrl(next));
  };

  // Va alla pagina di dettaglio del gioco scelto.
  const goToGame = (appId) => {
    setOpen(false);
    router.push(`/gioco/${appId}`);
  };

  // Invio: se c'e' un suggerimento evidenziato apro quel gioco, altrimenti
  // vado al negozio con il testo cercato.
  const handleSubmit = (e) => {
    e.preventDefault();
    if (active >= 0 && suggestions[active]) {
      goToGame(suggestions[active].appId);
    } else {
      setOpen(false);
      router.push(storeUrl(value));
    }
  };

  // Frecce / Esc per navigare il menu.
  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showMenu = open && value.trim().length > 0;

  return (
    <header className={styles.header}>
      {/* position:relative inline: ancora il menu senza toccare Header.module.css */}
      <form
        ref={boxRef}
        className={styles.searchBox}
        style={{ position: "relative" }}
        role="search"
        onSubmit={handleSubmit}
      >
        <Search size={18} className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder={t("common.search")}
          aria-label={t("common.search")}
          value={value}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showMenu}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
        />

        {/* Menu dei suggerimenti (stili dal modulo separato "sugg") */}
        {showMenu && (
          <ul className={sugg.suggestList} id="search-suggestions" role="listbox">
            {suggestions.length > 0 ? (
              suggestions.map((game, i) => (
                <li key={game.appId} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    className={`${sugg.suggestItem} ${i === active ? sugg.suggestActive : ""}`}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault(); // agisce prima del blur
                      goToGame(game.appId);
                    }}
                  >
                    <img
                      className={sugg.suggestThumb}
                      src={coverUrl(game.appId)}
                      alt=""
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                    />
                    <span className={sugg.suggestText}>
                      <span className={sugg.suggestName}>{game.name}</span>
                      {game.genres?.[0] && (
                        <span className={sugg.suggestGenre}>{game.genres[0]}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className={sugg.suggestEmpty}>{t("store.noResults")}</li>
            )}
          </ul>
        )}
      </form>

      <div className={styles.actions}>
        <div className={styles.iconCluster}>
          <SocialLinks />
          <NotificationButton />
        </div>
        <LanguageSwitcher />
        <button type="button" className={styles.user}>
          <Avatar name="Luca" size="md" />
          <span className={styles.userName}>Luca</span>
          <ChevronDown size={16} className={styles.chevron} />
        </button>
      </div>
    </header>
  );
}