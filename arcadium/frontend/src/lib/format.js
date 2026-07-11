// =============================================================================
// Funzioni di formattazione condivise, coerenti con i dati dei DTO del backend.
// Le pagine (catalogo, dettaglio, libreria, profilo...) le usano per mostrare
// prezzo, sconto, piattaforme, tempo di gioco e date sempre nello stesso modo.
// =============================================================================

import { PLATFORMS } from "./constants";

// -----------------------------------------------------------------------------
// Prezzo e sconto.
// ATTENZIONE: nel database i prezzi sono INCOERENTI (dati dal dataset/ETL):
// alcuni sono già in euro (es. 3.99, 13.99), altri in centesimi (es. 500, 99998).
// Regola tampone: se il valore è un intero grande (>= 1000) lo trattiamo come
// centesimi e dividiamo per 100; altrimenti è già in euro. (Fix vero: DB.)
// -----------------------------------------------------------------------------
export function formatPrice(rawPrice, discount = 0, lang = "it") {
  const n = Number(rawPrice ?? 0);

  // Decide l'unità: interi molto grandi = centesimi; il resto = già euro.
  const isCents = Number.isInteger(n) && n >= 1000;
  const value = isCents ? n / 100 : n;

  const pct = Number(discount ?? 0);
  const isFree = value <= 0;
  const hasDiscount = !isFree && pct > 0;
  const finalValue = hasDiscount ? value * (1 - pct / 100) : value;

  return {
    isFree,
    hasDiscount,
    discount: pct,
    original: formatCurrency(value, lang),
    final: formatCurrency(finalValue, lang),
    finalValue,
  };
}

// Formatta un importo in euro secondo la lingua (12,99 € oppure €12.99).
// NOTA: riceve un valore già in EURO.
export function formatCurrency(value, lang = "it") {
  const locale = lang === "en" ? "en-IE" : "it-IT";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(Number(value ?? 0));
}

// -----------------------------------------------------------------------------
// Piattaforme: dai booleani del DTO (windows/mac/linux) a un array di codici
// presenti, es. { windows:true, mac:false, linux:true } -> ["windows","linux"].
// -----------------------------------------------------------------------------
export function platformsOf(game) {
  if (!game) return [];
  return PLATFORMS.filter((p) => game[p] === true);
}

// -----------------------------------------------------------------------------
// Tempo di gioco: da minuti a un'etichetta leggibile.
//   playtimeLabel(750) -> "12 h 30 min"   ·   playtimeLabel(0) -> "0 min"
// -----------------------------------------------------------------------------
export function playtimeLabel(minutes) {
  const total = Number(minutes ?? 0);
  if (total <= 0) return "0 min";
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

// -----------------------------------------------------------------------------
// Data (release, iscrizione...) in formato locale. Accetta "2023-08-01" o ISO.
// -----------------------------------------------------------------------------
export function formatDate(value, lang = "it") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const locale = lang === "en" ? "en-GB" : "it-IT";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// -----------------------------------------------------------------------------
// Cover di riserva: se `headerImage` del DB manca, si può ricostruire l'URL
// standard di Steam dall'appId. GameImage mostra comunque un fallback grafico
// se anche questa non carica.
// -----------------------------------------------------------------------------
export function coverFallback(appId) {
  if (!appId) return null;
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}