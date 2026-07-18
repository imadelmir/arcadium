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

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

import { StoreCard, FilterDropdown, PriceRangeSlider, Pagination } from "@/components";
import { listGames, getGameFilters } from "@/lib/api/games";
import {
  makeSteamLabelLocalizer,
  GENRE_LABELS_IT,
  CATEGORY_LABELS_IT,
} from "@/lib/steamLabels";
import styles from "./negozio.module.css";

// Piattaforme accettate dal filtro `platform` del backend.
// Il VALORE resta minuscolo (lo usa il backend); l'etichetta mostrata è con
// l'iniziale maiuscola come gli altri filtri.
const PLATFORMS = ["windows", "mac", "linux"];
const PLATFORM_LABELS = { windows: "Windows", mac: "Mac", linux: "Linux" };

// Lingue principali del filtro Negozio. Il catalogo Steam contiene centinaia di
// voci lingua, alcune malformate (residui del dataset non eliminati da V12):
// qui teniamo solo le lingue principali. Il confronto è case-insensitive e mostra
// la stringa originale del backend; una lingua non presente in whitelist (o
// malformata) non compare. Per aggiungerne/toglierne basta editare questo set.
const PRINCIPAL_LANGUAGES = new Set([
  "english", "italian", "french", "german",
  "spanish - spain", "spanish - latin america",
  "portuguese", "portuguese - portugal", "portuguese - brazil",
  "russian", "polish", "turkish", "dutch",
  "japanese", "korean", "simplified chinese", "traditional chinese",
  "danish", "finnish", "norwegian", "swedish",
  "czech", "hungarian", "greek", "romanian", "bulgarian", "ukrainian",
  "thai", "vietnamese", "indonesian", "arabic",
]);

// Mappa nome-lingua (come arriva dal backend, in inglese) -> codice BCP47, usata
// per localizzare SOLO l'etichetta mostrata con Intl.DisplayNames (il valore
// inviato al backend resta la stringa inglese originale). Intl gestisce anche
// le varianti regione/scrittura ("Spanish - Spain" -> es-ES, ecc.).
const LANGUAGE_BCP47 = {
  "english": "en", "italian": "it", "french": "fr", "german": "de",
  "spanish - spain": "es-ES", "spanish - latin america": "es-419",
  "portuguese": "pt", "portuguese - portugal": "pt-PT", "portuguese - brazil": "pt-BR",
  "russian": "ru", "polish": "pl", "turkish": "tr", "dutch": "nl",
  "japanese": "ja", "korean": "ko", "simplified chinese": "zh-Hans", "traditional chinese": "zh-Hant",
  "danish": "da", "finnish": "fi", "norwegian": "no", "swedish": "sv",
  "czech": "cs", "hungarian": "hu", "greek": "el", "romanian": "ro",
  "bulgarian": "bg", "ukrainian": "uk", "thai": "th", "vietnamese": "vi",
  "indonesian": "id", "arabic": "ar",
};

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

// Ordinamento di default del Negozio (novità più recenti in cima).
const DEFAULT_SORT = "releaseDate,desc";

// Legge un filtro multi-valore dall'URL (valori separati da virgola).
const parseList = (v) => (v ? v.split(",").filter(Boolean) : []);

function NegozioContent() {
  const { t, i18n } = useTranslation();

  // Etichetta lingua localizzata nella lingua UI corrente (Intl.DisplayNames):
  // in italiano "Inglese", in inglese "English", ecc. Il VALORE del filtro resta
  // la stringa inglese del backend; cambia solo cio' che si vede. Ricalcolata al
  // cambio lingua; fallback alla stringa originale se il codice manca.
  const localizeLanguage = useMemo(() => {
    const uiLang = (i18n.language || "it").toLowerCase().startsWith("en") ? "en" : "it";
    let displayNames = null;
    try {
      displayNames = new Intl.DisplayNames([uiLang], { type: "language" });
    } catch {
      displayNames = null;
    }
    return (opt) => {
      const code = LANGUAGE_BCP47[opt.trim().toLowerCase()];
      if (displayNames && code) {
        const name = displayNames.of(code);
        if (name && name.toLowerCase() !== code.toLowerCase()) {
          return name.charAt(0).toUpperCase() + name.slice(1);
        }
      }
      return opt;
    };
  }, [i18n.language]);

  // Etichette localizzate per Generi e Categorie: come per la lingua, in
  // italiano mostriamo la traduzione, in inglese l'originale. Il VALORE del
  // filtro resta la stringa inglese del backend; cambia solo cio' che si vede.
  const localizeGenre = useMemo(
    () => makeSteamLabelLocalizer(GENRE_LABELS_IT, i18n.language),
    [i18n.language]
  );
  const localizeCategory = useMemo(
    () => makeSteamLabelLocalizer(CATEGORY_LABELS_IT, i18n.language),
    [i18n.language]
  );

  // Valori iniziali dei filtri letti dall'URL. Così tornando indietro dal
  // dettaglio di un gioco (o ricaricando/condividendo il link) i filtri
  // impostati vengono ripristinati invece di azzerarsi.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialQuery = searchParams.get("q") ?? "";
  const initialPlatform = searchParams.get("platform") ?? "";
  const initialGenres = parseList(searchParams.get("genre"));
  const initialLanguages = parseList(searchParams.get("language"));
  const initialCategories = parseList(searchParams.get("category"));
  const initialPrice = searchParams.get("price") ?? "";
  const minParam = searchParams.get("min");
  const maxParam = searchParams.get("max");
  const initialRange = {
    min: minParam !== null ? Number(minParam) : PRICE_MIN,
    max: maxParam !== null ? Number(maxParam) : PRICE_MAX,
  };
  const initialSort = searchParams.get("sort") ?? DEFAULT_SORT;
  const pageParam = searchParams.get("page");
  const initialPage = pageParam !== null ? Math.max(0, Number(pageParam) || 0) : 0;

  // Ricerca: `query` è il testo digitato (immediato), `debouncedQuery` è quello
  // effettivamente inviato al backend (aggiornato dopo una breve pausa).
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());

  // Stato dei filtri supportati dal backend.
  const [platform, setPlatform] = useState(initialPlatform);   // "" = tutte
  // Genere/Lingua/Categoria: MULTI-SELECT (change request Negozio). Ogni stato
  // è un array di nomi selezionati; array vuoto = nessun filtro (tutti inclusi).
  const [genreValues, setGenreValues] = useState(initialGenres);
  const [languageValues, setLanguageValues] = useState(initialLanguages);
  const [categoryValues, setCategoryValues] = useState(initialCategories);
  // Testo della mini ricerca dentro ciascun pannello (filtra la lista mostrata,
  // non chiama il backend: le opzioni sono già tutte caricate una volta sola).
  const [genreSearch, setGenreSearch] = useState("");
  const [languageSearch, setLanguageSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [price, setPrice] = useState(initialPrice);            // "" | free | paid | discounted
  const [range, setRange] = useState(initialRange);            // fascia di prezzo
  const [sort, setSort] = useState(initialSort);

  // Valori disponibili per le tendine Genere / Lingua / Categoria (dal backend).
  const [genreOptions, setGenreOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  // Paginazione (0-based lato stato, come il backend).
  const [page, setPage] = useState(initialPage);
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
  // Trascinare la fascia di prezzo ordina automaticamente per prezzo crescente
  // (dal minimo scelto in su): è il modo naturale di "sfogliare per budget".
  // "Ripristina" riporta anche l'ordinamento al default dell'app.
  const changeRange = (next) => { setRange(next); setSort("price,asc"); setPage(0); };
  const resetRange = () => { setRange({ min: PRICE_MIN, max: PRICE_MAX }); setSort(DEFAULT_SORT); setPage(0); };

  // Genere/Lingua/Categoria (multi-select): spunta/togli un valore dall'array.
  const toggleValue = (setValues) => (opt) => {
    setValues((prev) => (
      prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt]
    ));
    setPage(0);
  };
  const toggleGenre = toggleValue(setGenreValues);
  const toggleLanguage = toggleValue(setLanguageValues);
  const toggleCategory = toggleValue(setCategoryValues);
  const clearGenre = () => { setGenreValues([]); setPage(0); };
  const clearLanguage = () => { setLanguageValues([]); setPage(0); };
  const clearCategory = () => { setCategoryValues([]); setPage(0); };

  // --- Carica una sola volta i valori delle tendine Genere/Lingua/Categoria ---
  useEffect(() => {
    let attivo = true;
    getGameFilters()
      .then((f) => {
        if (!attivo) return;
        setGenreOptions(f.genres || []);
        // Solo le lingue principali: scarta l'esaustivo e le voci malformate.
        setLanguageOptions(
          (f.languages || []).filter((l) => PRINCIPAL_LANGUAGES.has(l.trim().toLowerCase()))
        );
        setCategoryOptions(f.categories || []);
      })
      .catch(() => { /* tendine vuote in caso di errore: i filtri restano opzionali */ });
    return () => { attivo = false; };
  }, []);

  // Cambio pagina dalla barra di paginazione: aggiorna la pagina e torna in alto.
  const goToPage = (p) => {
    setPage(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Tendina di filtro MULTI-SELECT su una lista di valori dal backend (Genere /
  // Lingua / Categoria, già in ordine alfabetico). Include una mini barra di
  // ricerca che filtra la lista mostrata (client-side, nessuna chiamata al
  // backend) e un link "Cancella" quando c'è almeno una selezione. La lista
  // scorre se lunga (es. le lingue).
  const renderLookupFilter = (labelKey, values, search, setSearch, options, onToggle, onClear, labelFor = (o) => o) => {
    const q = search.trim().toLowerCase();
    // Ordine alfabetico in base all'ETICHETTA mostrata (che per la lingua è
    // localizzata), non al valore inglese del backend: così le voci restano in
    // ordine sia con la pagina in IT sia in EN. Copia con slice() per non mutare
    // l'array di stato.
    const filteredOptions = (q ? options.filter((opt) => labelFor(opt).toLowerCase().includes(q)) : options)
      .slice()
      .sort((a, b) => labelFor(a).localeCompare(labelFor(b), i18n.language || undefined));
    const label = values.length > 0
      ? `${t(`store.filters.${labelKey}`)} (${values.length})`
      : t(`store.filters.${labelKey}`);

    return (
      <FilterDropdown label={label} active={values.length > 0}>
        <p className={styles.panelTitle}>{t(`store.filters.${labelKey}`)}</p>

        <div className={styles.panelSearchWrap}>
          <Search size={14} className={styles.panelSearchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.panelSearch}
            /* M6-T5: placeholder specifico del pannello (Cerca genere / Cerca
               giochi in / Cerca categoria) invece di un unico testo generico. */
            placeholder={t(`store.filters.searchIn.${labelKey}`)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t(`store.filters.${labelKey}`)}
          />
        </div>

        {values.length > 0 && (
          <button type="button" className={styles.resetBtn} onClick={onClear}>
            {t("store.filters.clearSelection")}
          </button>
        )}

        <div className={styles.optionsList}>
          {filteredOptions.length === 0 ? (
            <p className={styles.panelTitle}>{t("store.noResults")}</p>
          ) : (
            filteredOptions.map((opt) => (
              <label key={opt} className={styles.option}>
                <input
                  type="checkbox"
                  className={styles.optionInput}
                  checked={values.includes(opt)}
                  onChange={() => onToggle(opt)}
                />
                <span>{labelFor(opt)}</span>
              </label>
            ))
          )}
        </div>
      </FilterDropdown>
    );
  };

  // Riflette i filtri correnti nell'URL (replace: non sporca la cronologia e non
  // scrolla). Così l'entry di /negozio nella cronologia porta con sé i filtri e
  // il "back" dal dettaglio di un gioco li ripristina; il link è anche
  // condivisibile/ricaricabile. Si scrivono solo i valori diversi dal default.
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (platform) params.set("platform", platform);
    if (genreValues.length) params.set("genre", genreValues.join(","));
    if (languageValues.length) params.set("language", languageValues.join(","));
    if (categoryValues.length) params.set("category", categoryValues.join(","));
    if (price) params.set("price", price);
    if (range.min > PRICE_MIN) params.set("min", String(range.min));
    if (range.max < PRICE_MAX) params.set("max", String(range.max));
    if (sort !== DEFAULT_SORT) params.set("sort", sort);
    if (page > 0) params.set("page", String(page));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedQuery, platform, genreValues, languageValues, categoryValues, price, range, sort, page, pathname, router]);

  // --- Ricarica dal backend a ogni variazione di ricerca, filtri o pagina ---
  useEffect(() => {
    let attivo = true;

    // M6-T4: il caricamento sta dentro una funzione asincrona, cosi' non c'e'
    // setState nel corpo sincrono dell'effetto. Qui lo spinner al cambio di
    // filtro/pagina serve, quindi setLoading(true) resta — solo, spostato.
    const carica = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await listGames({
          q: debouncedQuery || undefined,
          platform: platform || undefined,
          genre: genreValues.length ? genreValues : undefined,
          language: languageValues.length ? languageValues : undefined,
          category: categoryValues.length ? categoryValues : undefined,
          status: price || undefined,
          // La fascia di prezzo viene inviata solo se diversa dall'intervallo pieno.
          minPrice: rangeActive ? range.min : undefined,
          maxPrice: rangeActive ? range.max : undefined,
          // Vetrina: a ricerca vuota mostra solo i titoli in caratteri europei;
          // appena si cerca (debouncedQuery presente) il filtro si spegne e si
          // cerca in tutto il catalogo (asiatici, simboli, cifre inclusi).
          europeanOnly: debouncedQuery ? undefined : true,
          sort,
          page,
          size: PAGE_SIZE,
        });
        if (!attivo) return;
        setGames(res.content);         // PageResponse.content = lista giochi
        setTotalPages(res.totalPages); // PageResponse.totalPages = numero pagine
      } catch {
        if (attivo) setError(true);
      } finally {
        if (attivo) setLoading(false);
      }
    };

    carica();
    return () => {
      attivo = false;
    };
  }, [
    debouncedQuery, platform,
    genreValues.join(","), languageValues.join(","), categoryValues.join(","),
    price, rangeActive, range.min, range.max, sort, page,
  ]);

  return (
    <div className={styles.page}>
      {/* Testata fissa: titolo + ricerca + filtri restano in alto mentre
          scorre solo la griglia dei giochi (change request layout). */}
      <div className={styles.stickyHead}>
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
              <span>{PLATFORM_LABELS[pf]}</span>
            </label>
          ))}
        </FilterDropdown>

        {/* Genere: multi-select con mini ricerca (valori dal backend) */}
        {renderLookupFilter("genre", genreValues, genreSearch, setGenreSearch, genreOptions, toggleGenre, clearGenre, localizeGenre)}

        {/* Lingua: multi-select con mini ricerca (valori dal backend, solo quelle con giochi associati) */}
        {renderLookupFilter("language", languageValues, languageSearch, setLanguageSearch, languageOptions, toggleLanguage, clearLanguage, localizeLanguage)}

        {/* Categoria: multi-select con mini ricerca (valori dal backend) */}
        {renderLookupFilter("category", categoryValues, categorySearch, setCategorySearch, categoryOptions, toggleCategory, clearCategory, localizeCategory)}

        {/* Ordina: ancorato a destra */}
        <FilterDropdown
          className={styles.sort}
          align="right"
          active={sort !== DEFAULT_SORT}
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
      </div>

      {/* Area che scorre: la testata sopra resta FUORI, quindi nessuna card le
          passa dietro e puo' restare trasparente (l'effetto animato di sfondo
          resta visibile come prima). */}
      <div className={styles.scrollArea}>

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