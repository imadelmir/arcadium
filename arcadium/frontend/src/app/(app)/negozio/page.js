"use client";

// Pagina Negozio / catalogo (M5 - T8) — COLLEGATA al backend (M5-T13).
// -----------------------------------------------------------------------------
// Carica i giochi VERI da GET /api/games (nessun dato mock). I filtri supportati
// dal backend (ricerca, piattaforma, prezzo, fascia di prezzo, ordinamento)
// vengono passati al server, che restituisce la lista già filtrata e paginata
// (PageResponse).
//
// Change request Negozio:
//   - barra di ricerca DOMINANTE in cima alla pagina (non più solo dall'header);
//   - filtri Genere e Sviluppatore RIMOSSI dalla barra (i parametri restano
//     disponibili lato API, ma la pagina non li usa più);
//   - filtro Prezzo con SLIDER a fascia (min/max) trascinabile e resettabile;
//   - ordinamento con opzione Z -> A (oltre ad A -> Z);
//   - PAGINAZIONE: 300 giochi per pagina, con barra "Pagina 1/2/…" e ritorno
//     in alto al cambio pagina.

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

import { StoreCard, FilterDropdown, PriceRangeSlider, Pagination } from "@/components";
import { listGames } from "@/lib/api/games";
import styles from "./negozio.module.css";

// Piattaforme accettate dal filtro `platform` del backend.
const PLATFORMS = ["windows", "mac", "linux"];

// Voci del filtro "Prezzo" (stato commerciale) mappate all'enum del backend.
const PRICE_OPTIONS = [
  ["", "anyPrice"],
  ["free", "free"],
  ["paid", "paid"],
  ["discounted", "onSale"],
];

// Voci di ordinamento mappate al parametro `sort` di Spring Data.
// A -> Z e Z -> A ordinano per nome (crescente/decrescente).
const SORT_OPTIONS = [
  ["name,asc", "name"],       // A -> Z
  ["name,desc", "nameDesc"],  // Z -> A (change request Negozio)
  ["price,asc", "priceAsc"],
  ["price,desc", "priceDesc"],
  ["releaseDate,desc", "newest"],
];

// Numero di giochi per pagina (change request Negozio).
const PAGE_SIZE = 300;

// Estremi della scala della slider prezzo (in euro).
const PRICE_MIN = 0;
const PRICE_MAX = 100;

function NegozioContent() {
  const { t } = useTranslation();

  // Valore iniziale della ricerca: eventuale ?q= arrivato dall'header.
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  // Ricerca: `query` è il testo digitato (immediato), `debouncedQuery` è quello
  // effettivamente inviato al backend (aggiornato dopo una breve pausa).
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());

  // Stato dei filtri supportati dal backend.
  const [platform, setPlatform] = useState("");            // "" = tutte
  const [price, setPrice] = useState("");                  // "" | free | paid | discounted
  const [range, setRange] = useState({ min: PRICE_MIN, max: PRICE_MAX }); // fascia di prezzo
  const [sort, setSort] = useState("releaseDate,desc");

  // Paginazione (0-based lato stato, come il backend).
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Stato dei dati.
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // La fascia di prezzo è "attiva" se diversa dall'intervallo pieno.
  const rangeActive = range.min > PRICE_MIN || range.max < PRICE_MAX;

  // --- Debounce della ricerca: dopo 300ms aggiorna la query e torna a pag. 0 ---
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  // --- Handler dei filtri: cambiano il valore e riportano SEMPRE a pagina 0 ---
  const changePlatform = (v) => { setPlatform(v); setPage(0); };
  const changePrice = (v) => { setPrice(v); setPage(0); };
  const changeSort = (v) => { setSort(v); setPage(0); };
  const changeRange = (next) => { setRange(next); setPage(0); };
  const resetRange = () => { setRange({ min: PRICE_MIN, max: PRICE_MAX }); setPage(0); };

  // Cambio pagina dalla barra di paginazione: aggiorna la pagina e torna in alto.
  const goToPage = (p) => {
    setPage(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // --- Ricarica dal backend a ogni variazione di ricerca, filtri o pagina ---
  useEffect(() => {
    let attivo = true;
    setLoading(true);
    setError(false);

    listGames({
      q: debouncedQuery || undefined,
      platform: platform || undefined,
      status: price || undefined,
      // La fascia di prezzo viene inviata solo se diversa dall'intervallo pieno.
      minPrice: rangeActive ? range.min : undefined,
      maxPrice: rangeActive ? range.max : undefined,
      sort,
      page,
      size: PAGE_SIZE,
    })
      .then((res) => {
        if (!attivo) return;
        setGames(res.content);       // PageResponse.content = lista giochi
        setTotalPages(res.totalPages); // PageResponse.totalPages = numero pagine
      })
      .catch(() => {
        if (attivo) setError(true);
      })
      .finally(() => {
        if (attivo) setLoading(false);
      });

    return () => {
      attivo = false;
    };
    // rangeActive dipende da range.min/range.max: bastano quelli nelle dipendenze.
  }, [debouncedQuery, platform, price, range.min, range.max, sort, page]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title} suppressHydrationWarning>
          {t("pages.negozio.title")}
        </h1>
      </header>

      {/* --- Barra di ricerca DOMINANTE (change request Negozio) --- */}
      <div className={styles.searchBar}>
        <Search className={styles.searchIcon} size={22} aria-hidden="true" />
        <input
          type="search"
          className={styles.searchInput}
          placeholder={t("store.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t("store.searchPlaceholder")}
        />
        {query && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => setQuery("")}
            aria-label={t("store.clearSearch")}
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* --- Barra dei filtri (solo quelli che il backend supporta) --- */}
      <div className={styles.filters} role="search">
        {/* Prezzo: stato commerciale (radio) + fascia di prezzo (slider) */}
        <FilterDropdown label={t("store.filters.price")} active={price !== "" || rangeActive}>
          <p className={styles.panelTitle}>{t("store.filters.price")}</p>
          {PRICE_OPTIONS.map(([value, labelKey]) => (
            <label key={value || "all"} className={styles.option}>
              <input
                type="radio"
                name="price"
                className={styles.optionInput}
                checked={price === value}
                onChange={() => changePrice(value)}
              />
              <span>{t(`store.filters.${labelKey}`)}</span>
            </label>
          ))}

          {/* Fascia di prezzo trascinabile (min/max), applicata ai risultati */}
          <div className={styles.rangeBlock}>
            <p className={styles.panelTitle}>{t("store.filters.priceRange")}</p>
            <PriceRangeSlider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={1}
              minValue={range.min}
              maxValue={range.max}
              onChange={changeRange}
              format={(v) => `${v} €${v >= PRICE_MAX ? "+" : ""}`}
              ariaMinLabel={t("store.filters.minPrice")}
              ariaMaxLabel={t("store.filters.maxPrice")}
            />
            {rangeActive && (
              <button type="button" className={styles.resetBtn} onClick={resetRange}>
                {t("store.filters.reset")}
              </button>
            )}
          </div>
        </FilterDropdown>

        {/* Piattaforma: scelta singola */}
        <FilterDropdown label={t("store.filters.platform")} active={platform !== ""}>
          <p className={styles.panelTitle}>{t("store.filters.platform")}</p>
          <label className={styles.option}>
            <input
              type="radio"
              name="platform"
              className={styles.optionInput}
              checked={platform === ""}
              onChange={() => changePlatform("")}
            />
            <span>{t("common.all")}</span>
          </label>
          {PLATFORMS.map((pf) => (
            <label key={pf} className={styles.option}>
              <input
                type="radio"
                name="platform"
                className={styles.optionInput}
                checked={platform === pf}
                onChange={() => changePlatform(pf)}
              />
              <span>{pf}</span>
            </label>
          ))}
        </FilterDropdown>

        {/* Ordina: ancorato a destra */}
        <FilterDropdown
          className={styles.sort}
          align="right"
          active={sort !== "releaseDate,desc"}
          label={`${t("store.sort.label")}`}
        >
          <p className={styles.panelTitle}>{t("store.sort.label")}</p>
          {SORT_OPTIONS.map(([value, labelKey]) => (
            <label key={value} className={styles.option}>
              <input
                type="radio"
                name="sort"
                className={styles.optionInput}
                checked={sort === value}
                onChange={() => changeSort(value)}
              />
              <span>{t(`store.sort.${labelKey}`)}</span>
            </label>
          ))}
        </FilterDropdown>
      </div>

      {/* --- Risultati --- */}
      {loading ? (
        <div className={styles.empty}>{t("common.loading")}</div>
      ) : error ? (
        <div className={styles.empty}>{t("errors.network")}</div>
      ) : games.length > 0 ? (
        <>
          <div className={styles.grid}>
            {games.map((game) => (
              <StoreCard key={game.appId} game={game} />
            ))}
          </div>

          {/* Barra di paginazione: "Pagina 1", "Pagina 2", … + Precedente/Successiva */}
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={goToPage}
            labels={{
              previous: t("store.pagination.previous"),
              next: t("store.pagination.next"),
              page: t("store.pagination.page"),
            }}
          />
        </>
      ) : (
        <div className={styles.empty}>{t("store.noResults")}</div>
      )}
    </div>
  );
}

// useSearchParams richiede un confine <Suspense>.
export default function NegozioPage() {
  return (
    <Suspense fallback={null}>
      <NegozioContent />
    </Suspense>
  );
}
