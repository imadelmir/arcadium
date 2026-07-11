"use client";

// Pagina Negozio / catalogo (M5 - T8) — COLLEGATA al backend (M5-T13).
// -----------------------------------------------------------------------------
// Carica i giochi VERI da GET /api/games (nessun dato mock). I filtri supportati
// dal backend (ricerca, genere, piattaforma, prezzo, ordinamento) vengono
// passati al server, che restituisce la lista già filtrata e paginata
// (PageResponse). La ricerca arriva dalla barra dell'header tramite ?q=.

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { StoreCard, FilterDropdown } from "@/components";
import { listGames } from "@/lib/api/games";
import styles from "./negozio.module.css";

// Generi principali del catalogo (il backend filtra per NOME del genere).
// I nomi rispecchiano quelli del dataset Steam nel DB (in inglese).
const GENRES = ["Action", "Adventure", "RPG", "Strategy", "Indie", "Simulation", "Casual", "Sports", "Racing"];

// Piattaforme accettate dal filtro `platform` del backend.
const PLATFORMS = ["windows", "mac", "linux"];

// Voci del filtro "Prezzo" mappate all'enum del backend (status).
const PRICE_OPTIONS = [
  ["", "anyPrice"],
  ["free", "free"],
  ["paid", "paid"],
  ["discounted", "onSale"],
];

// Voci di ordinamento mappate al parametro `sort` di Spring Data.
const SORT_OPTIONS = [
  ["name,asc", "name"],
  ["price,asc", "priceAsc"],
  ["price,desc", "priceDesc"],
  ["releaseDate,desc", "newest"],
];

function NegozioContent() {
  const { t } = useTranslation();

  // Ricerca dalla barra dell'header (?q=...).
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  // Stato dei filtri supportati dal backend.
  const [genre, setGenre] = useState("");       // un genere per volta ("" = tutti)
  const [platform, setPlatform] = useState("");  // "" = tutte
  const [price, setPrice] = useState("");        // "" | free | paid | discounted
  const [sort, setSort] = useState("releaseDate,desc");

  // Stato dei dati.
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Ricarica dal backend ogni volta che cambiano ricerca o filtri.
  useEffect(() => {
    let attivo = true;
    setLoading(true);
    setError(false);

    listGames({
      q: query.trim() || undefined,
      genre: genre || undefined,
      platform: platform || undefined,
      status: price || undefined,
      sort,
      page: 0,
      size: 40,
    })
      .then((res) => {
        if (attivo) setGames(res.content); // PageResponse.content = lista giochi
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
  }, [query, genre, platform, price, sort]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title} suppressHydrationWarning>
          {t("pages.negozio.title")}
        </h1>
      </header>

      {/* --- Barra dei filtri (solo quelli che il backend supporta) --- */}
      <div className={styles.filters} role="search">
        {/* Genere: scelta singola */}
        <FilterDropdown label={t("store.filters.genre")} active={genre !== ""}>
          <p className={styles.panelTitle}>{t("store.filters.genre")}</p>
          <label className={styles.option}>
            <input
              type="radio"
              name="genre"
              className={styles.optionInput}
              checked={genre === ""}
              onChange={() => setGenre("")}
            />
            <span>{t("common.all")}</span>
          </label>
          {GENRES.map((g) => (
            <label key={g} className={styles.option}>
              <input
                type="radio"
                name="genre"
                className={styles.optionInput}
                checked={genre === g}
                onChange={() => setGenre(g)}
              />
              <span>{g}</span>
            </label>
          ))}
        </FilterDropdown>

        {/* Prezzo: scelta singola */}
        <FilterDropdown label={t("store.filters.price")} active={price !== ""}>
          <p className={styles.panelTitle}>{t("store.filters.price")}</p>
          {PRICE_OPTIONS.map(([value, labelKey]) => (
            <label key={value || "all"} className={styles.option}>
              <input
                type="radio"
                name="price"
                className={styles.optionInput}
                checked={price === value}
                onChange={() => setPrice(value)}
              />
              <span>{t(`store.filters.${labelKey}`)}</span>
            </label>
          ))}
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
              onChange={() => setPlatform("")}
            />
            <span>{t("common.all")}</span>
          </label>
          {PLATFORMS.map((p) => (
            <label key={p} className={styles.option}>
              <input
                type="radio"
                name="platform"
                className={styles.optionInput}
                checked={platform === p}
                onChange={() => setPlatform(p)}
              />
              <span>{p}</span>
            </label>
          ))}
        </FilterDropdown>

        {/* Ordina: ancorato a destra */}
        <FilterDropdown
          className={styles.sort}
          align="right"
          active={sort !== "name,asc"}
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
                onChange={() => setSort(value)}
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
        <div className={styles.grid}>
          {games.map((game) => (
            <StoreCard key={game.appId} game={game} />
          ))}
        </div>
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