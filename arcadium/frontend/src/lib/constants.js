// =============================================================================
// Costanti condivise, allineate 1:1 al backend e al DB.
// Un'unica fonte per i valori "magici" (codici stato, filtri catalogo,
// piattaforme): se il backend cambia un valore, si cambia SOLO qui.
//
// REGOLA (M6-T4): ogni `labelKey` qui dentro DEVE esistere in
// src/i18n/locales/it.json e en.json, altrimenti l'interfaccia stampa la
// chiave grezza (es. "status.mai_giocato") al posto dell'etichetta.
// =============================================================================

// -----------------------------------------------------------------------------
// Stati del backlog — CODICI ESATTI del DB (seed R__backlog_status.sql) e del
// backend (BacklogStatusResponse.code). NON usare valori inglesi tipo "playing".
// L'ordine è quello di visualizzazione (sort_order del seed).
// `labelKey` punta al blocco "status" dell'i18n; `cssClass` alle classi già
// esistenti in StatusBadge.module.css (never/playing/finished/abandoned).
// -----------------------------------------------------------------------------
export const BACKLOG_STATUSES = [
  { code: "mai_giocato", labelKey: "status.mai_giocato", cssClass: "never" },
  { code: "in_corso", labelKey: "status.in_corso", cssClass: "playing" },
  { code: "finito", labelKey: "status.finito", cssClass: "finished" },
  { code: "abbandonato", labelKey: "status.abbandonato", cssClass: "abandoned" },
];

// Mappa codice -> config, comoda per lookup diretti (es. StatusBadge).
export const BACKLOG_STATUS_BY_CODE = Object.fromEntries(
  BACKLOG_STATUSES.map((s) => [s.code, s])
);

// Solo i codici, nell'ordine UI.
export const BACKLOG_STATUS_CODES = BACKLOG_STATUSES.map((s) => s.code);

// -----------------------------------------------------------------------------
// Filtro "status" del CATALOGO (diverso dagli stati del backlog!).
// Rispecchia l'enum CatalogGameStatus del backend: free | paid | discounted.
// -----------------------------------------------------------------------------
export const CATALOG_STATUS = {
  FREE: "free",
  PAID: "paid",
  DISCOUNTED: "discounted",
};

// -----------------------------------------------------------------------------
// Piattaforme — corrispondono ai booleani windows/mac/linux dei DTO gioco e ai
// valori accettati dal filtro `platform` del catalogo.
// -----------------------------------------------------------------------------
export const PLATFORMS = ["windows", "mac", "linux"];

// -----------------------------------------------------------------------------
// Ordinamenti disponibili nel catalogo. `value` è il parametro Spring Data
// ("campo,direzione"): il campo deve esistere sull'entità Game ed essere fra
// quelli ammessi da GameService.SORTABLE_FIELDS.
// Le etichette riusano il blocco i18n "store.sort" della pagina Negozio: un
// solo set di traduzioni per gli stessi ordinamenti.
// -----------------------------------------------------------------------------
export const CATALOG_SORTS = [
  { value: "name,asc", labelKey: "store.sort.name" },
  { value: "name,desc", labelKey: "store.sort.nameDesc" },
  { value: "price,asc", labelKey: "store.sort.priceAsc" },
  { value: "price,desc", labelKey: "store.sort.priceDesc" },
  { value: "releaseDate,desc", labelKey: "store.sort.newest" },
];

// Dimensione pagina di default del catalogo (coerente col backend: 20).
export const DEFAULT_PAGE_SIZE = 20;
