// =============================================================================
// Etichette dei contenuti per adulti (change request safe search, V18).
// -----------------------------------------------------------------------------
// Copia dell'elenco che il backend usa in GameSpecifications.ADULT_LABELS.
// Qui NON serve a filtrare i giochi — quello lo fa il server, ed e' l'unico
// punto che conta — ma a togliere le stesse voci dalle tendine "Genere" e
// "Categoria" del Negozio quando il safe search e' attivo: senza, l'utente
// vedrebbe un filtro "Nudity" selezionabile che restituisce sempre zero
// risultati, il che sembra un bug.
//
// Duplicazione consapevole: sono due strati diversi (sicurezza vs. presentazione)
// e un endpoint dedicato solo per trasportare 12 stringhe costanti non si
// giustifica. Se l'elenco cambia lato backend va allineato anche qui.
// =============================================================================

const ADULT_LABELS = new Set([
  "sexual content",
  "nudity",
  "nsfw",
  "hentai",
  "adult",
  "adult content",
  "mature",
  "eroge",
  "erotic",
  "porn",
  "sexual themes",
  "lgbtq+ sexual content",
]);

/** true se l'etichetta (genere o categoria) identifica un contenuto per adulti. */
export function isAdultLabel(label) {
  return ADULT_LABELS.has(String(label ?? "").trim().toLowerCase());
}

/**
 * Toglie le etichette per adulti da una lista di opzioni di filtro.
 * Con `attivo` false restituisce la lista intera (nessuna copia inutile).
 */
export function withoutAdultLabels(options, attivo) {
  if (!attivo) return options;
  return options.filter((opt) => !isAdultLabel(opt));
}
