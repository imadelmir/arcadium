"use client";

// Pagina Negozio / catalogo (M5 - T8).
// -----------------------------------------------------------------------------
// Fedele al mockup "Negozio": barra dei filtri a pillole in stile glass
// (Genere multi-selezione, Prezzo, Sconto, Piattaforma, Valutazione, Lingua) con
// "Ordina" ancorato a destra, griglia responsive di StoreCard e sezione in
// evidenza "Sconti del momento". Filtro e ordinamento avvengono lato client sul
// catalogo finto; la sorgente dati sarà sostituita dall'API in una task futura.

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import { Input, StoreCard, FilterDropdown } from "@/components";
import { discountedPrice } from "@/utils/price";
import { STORE_GAMES } from "./mockGames";
import styles from "./negozio.module.css";

// --- Opzioni dei filtri -------------------------------------------------------

// Fasce di prezzo (valori in centesimi; Infinity = nessun limite superiore).
const PRICE_RANGES = {
  all: [0, Infinity],
  free: [0, 0],
  under10: [1, 999],
  under20: [1, 1999],
  under40: [1, 3999],
};

// Sconto minimo richiesto per ogni voce del filtro "Sconto" (-1 = qualsiasi).
const DISCOUNT_MIN = { all: -1, onSale: 1, d25: 25, d50: 50, d75: 75 };

// Valutazione minima (% recensioni positive) per il filtro "Valutazione".
const RATING_MIN = { all: 0, r70: 70, r80: 80, r90: 90 };

// Liste ricavate dal catalogo, in ordine alfabetico, per i menu a tendina.
const ALL_GENRES = [...new Set(STORE_GAMES.flatMap((g) => g.genres))].sort((a, b) =>
  a.localeCompare(b, "it"),
);
const ALL_PLATFORMS = [...new Set(STORE_GAMES.flatMap((g) => g.platforms))].sort();
const ALL_LANGUAGES = [...new Set(STORE_GAMES.flatMap((g) => g.languages))].sort((a, b) =>
  a.localeCompare(b, "it"),
);

// Aggiunge/rimuove un valore da un array (per i filtri multi-selezione).
const toggle = (arr, value) =>
  arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

export default function NegozioPage() {
  const { t } = useTranslation();

  // Stato dei filtri: uno per ogni controllo della barra.
  const [query, setQuery] = useState("");                 // testo di ricerca
  const [genres, setGenres] = useState([]);               // generi (multi)
  const [priceRange, setPriceRange] = useState("all");    // fascia di prezzo
  const [discountFilter, setDiscountFilter] = useState("all"); // sconto minimo
  const [platforms, setPlatforms] = useState([]);         // piattaforme (multi)
  const [rating, setRating] = useState("all");            // valutazione minima
  const [language, setLanguage] = useState("all");        // lingua supportata
  const [sort, setSort] = useState("popularity");         // ordinamento

  // Applica ricerca + filtri, poi ordina. useMemo: ricalcola solo al cambiare
  // di uno degli ingressi.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const [min, max] = PRICE_RANGES[priceRange];
    const minDiscount = DISCOUNT_MIN[discountFilter];
    const minRating = RATING_MIN[rating];

    const filtered = STORE_GAMES.filter((game) => {
      // Ricerca sul titolo
      if (q && !game.name.toLowerCase().includes(q)) return false;
      // Genere: passa se il gioco ha almeno uno dei generi selezionati
      if (genres.length && !genres.some((g) => game.genres.includes(g))) return false;
      // Piattaforma: almeno una tra quelle selezionate
      if (platforms.length && !platforms.some((p) => game.platforms.includes(p))) return false;
      // Sconto minimo
      if (game.discount < minDiscount) return false;
      // Valutazione minima
      if (game.rating < minRating) return false;
      // Lingua supportata
      if (language !== "all" && !game.languages.includes(language)) return false;
      // Fascia di prezzo (sul prezzo finale, sconto incluso)
      const finalPrice = discountedPrice(game.priceCents, game.discount);
      if (finalPrice < min || finalPrice > max) return false;
      return true;
    });

    const byFinalPrice = (g) => discountedPrice(g.priceCents, g.discount);

    // Comparatori: uno per ogni voce del menu "Ordina".
    const sorters = {
      popularity: (a, b) => b.reviews - a.reviews, // più recensioni = più popolare
      priceAsc: (a, b) => byFinalPrice(a) - byFinalPrice(b),
      priceDesc: (a, b) => byFinalPrice(b) - byFinalPrice(a),
      discount: (a, b) => b.discount - a.discount,
      rating: (a, b) => b.rating - a.rating,
      name: (a, b) => a.name.localeCompare(b.name, "it"),
    };

    return [...filtered].sort(sorters[sort] ?? sorters.popularity);
  }, [query, genres, priceRange, discountFilter, platforms, rating, language, sort]);

  // I 4 giochi più scontati per la strip "Sconti del momento" (ignora i filtri).
  const deals = useMemo(
    () =>
      STORE_GAMES.filter((g) => g.discount > 0)
        .sort((a, b) => b.discount - a.discount)
        .slice(0, 4),
    [],
  );

  return (
    <div className={styles.page}>
      {/* Intestazione pagina */}
      <header className={styles.header}>
        <h1 className={styles.title}>{t("pages.negozio.title")}</h1>
        <p className={styles.subtitle}>{t("pages.negozio.subtitle")}</p>
      </header>

      {/* --- Barra dei filtri (pillole glass) --- */}
      <div className={styles.filters} role="search">
        {/* Ricerca */}
        <Input
          className={styles.searchField}
          name="store-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("store.searchPlaceholder")}
          aria-label={t("store.searchPlaceholder")}
          iconLeft={<Search size={18} />}
        />

        {/* Genere: multi-selezione con checkbox */}
        <FilterDropdown label={t("store.filters.genre")} count={genres.length}>
          <p className={styles.panelTitle}>{t("store.filters.genre")}</p>
          {ALL_GENRES.map((g) => (
            <label key={g} className={styles.option}>
              <input
                type="checkbox"
                className={styles.optionInput}
                checked={genres.includes(g)}
                onChange={() => setGenres((prev) => toggle(prev, g))}
              />
              <span>{g}</span>
            </label>
          ))}
        </FilterDropdown>

        {/* Prezzo: scelta singola */}
        <FilterDropdown label={t("store.filters.price")} active={priceRange !== "all"}>
          <p className={styles.panelTitle}>{t("store.filters.price")}</p>
          {[
            ["all", t("store.filters.anyPrice")],
            ["free", t("store.filters.free")],
            ["under10", t("store.filters.under10")],
            ["under20", t("store.filters.under20")],
            ["under40", t("store.filters.under40")],
          ].map(([value, label]) => (
            <label key={value} className={styles.option}>
              <input
                type="radio"
                name="price"
                className={styles.optionInput}
                checked={priceRange === value}
                onChange={() => setPriceRange(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </FilterDropdown>

        {/* Sconto: scelta singola */}
        <FilterDropdown label={t("store.filters.discount")} active={discountFilter !== "all"}>
          <p className={styles.panelTitle}>{t("store.filters.discount")}</p>
          {[
            ["all", t("store.filters.anyDiscount")],
            ["onSale", t("store.filters.onSale")],
            ["d25", t("store.filters.d25")],
            ["d50", t("store.filters.d50")],
            ["d75", t("store.filters.d75")],
          ].map(([value, label]) => (
            <label key={value} className={styles.option}>
              <input
                type="radio"
                name="discount"
                className={styles.optionInput}
                checked={discountFilter === value}
                onChange={() => setDiscountFilter(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </FilterDropdown>

        {/* Piattaforma: multi-selezione */}
        <FilterDropdown label={t("store.filters.platform")} count={platforms.length}>
          <p className={styles.panelTitle}>{t("store.filters.platform")}</p>
          {ALL_PLATFORMS.map((p) => (
            <label key={p} className={styles.option}>
              <input
                type="checkbox"
                className={styles.optionInput}
                checked={platforms.includes(p)}
                onChange={() => setPlatforms((prev) => toggle(prev, p))}
              />
              <span>{p}</span>
            </label>
          ))}
        </FilterDropdown>

        {/* Valutazione: scelta singola (soglia minima) */}
        <FilterDropdown label={t("store.filters.rating")} active={rating !== "all"}>
          <p className={styles.panelTitle}>{t("store.filters.rating")}</p>
          {[
            ["all", t("store.filters.anyRating")],
            ["r90", t("store.filters.r90")],
            ["r80", t("store.filters.r80")],
            ["r70", t("store.filters.r70")],
          ].map(([value, label]) => (
            <label key={value} className={styles.option}>
              <input
                type="radio"
                name="rating"
                className={styles.optionInput}
                checked={rating === value}
                onChange={() => setRating(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </FilterDropdown>

        {/* Lingua: scelta singola */}
        <FilterDropdown label={t("store.filters.language")} active={language !== "all"}>
          <p className={styles.panelTitle}>{t("store.filters.language")}</p>
          <label className={styles.option}>
            <input
              type="radio"
              name="language"
              className={styles.optionInput}
              checked={language === "all"}
              onChange={() => setLanguage("all")}
            />
            <span>{t("store.filters.anyLanguage")}</span>
          </label>
          {ALL_LANGUAGES.map((l) => (
            <label key={l} className={styles.option}>
              <input
                type="radio"
                name="language"
                className={styles.optionInput}
                checked={language === l}
                onChange={() => setLanguage(l)}
              />
              <span>{l}</span>
            </label>
          ))}
        </FilterDropdown>

        {/* Ordina: ancorato a destra */}
        <FilterDropdown
          className={styles.sort}
          align="right"
          active={sort !== "popularity"}
          label={`${t("store.sort.label")}: ${t(`store.sort.${sort}`)}`}
        >
          <p className={styles.panelTitle}>{t("store.sort.label")}</p>
          {["popularity", "priceAsc", "priceDesc", "discount", "rating", "name"].map((value) => (
            <label key={value} className={styles.option}>
              <input
                type="radio"
                name="sort"
                className={styles.optionInput}
                checked={sort === value}
                onChange={() => setSort(value)}
              />
              <span>{t(`store.sort.${value}`)}</span>
            </label>
          ))}
        </FilterDropdown>
      </div>

      {/* --- Risultati --- */}
      <p className={styles.count}>{t("store.results", { count: results.length })}</p>

      {results.length > 0 ? (
        <div className={styles.grid}>
          {results.map((game) => (
            <StoreCard key={game.appId} game={game} />
          ))}
        </div>
      ) : (
        // Stato vuoto: nessun gioco corrisponde ai filtri
        <div className={styles.empty}>{t("store.noResults")}</div>
      )}

      {/* --- Sconti del momento (in evidenza, sotto ai risultati) --- */}
      {deals.length > 0 && (
        <section className={styles.deals} aria-labelledby="deals-title">
          <h2 id="deals-title" className={styles.sectionTitle}>
            {t("store.dealsTitle")}
          </h2>
          <div className={styles.dealsGrid}>
            {deals.map((game) => (
              <StoreCard key={game.appId} game={game} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}