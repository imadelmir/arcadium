// chartColors.js
// -----------------------------------------------------------------------------
// Colori usati DENTRO i grafici Recharts (SVG): le variabili CSS "var(--...)"
// non funzionano negli attributi SVG, quindi qui stanno i valori esadecimali,
// presi dagli stessi token del tema (theme.css) per restare coerenti con l'app.

// Colori generali dei grafici (testo assi, griglia, tinte brand).
export const CHART = {
  text: "#8b92a8", // --color-text-muted (etichette assi)
  grid: "#232b44", // --color-border     (griglia)
  violet: "#7c5cff", // --color-primary
  blue: "#4f7bff", // --color-accent-blue
};

// Palette per il grafico a torta dei generi (un colore per fetta).
export const GENRE_PALETTE = [
  "#7c5cff", // viola brand
  "#4f7bff", // blu
  "#34d399", // verde
  "#f5b14c", // ambra
  "#f06b6b", // rosso
  "#a78bfa", // viola chiaro
  "#22d3ee", // ciano
];

// Un colore per ogni stato del backlog. Le CHIAVI sono i codici veri del DB
// (mai_giocato / in_corso / finito / abbandonato), come nel resto dell'app.
// IMPORTANTE: questi valori DEVONO restare allineati ai token --status-* di
// theme.css, così lo stesso stato ha lo stesso colore su TUTTE le pagine
// (badge in Libreria/Backlog/Profilo e barre in Statistiche).
export const STATUS_COLORS = {
  mai_giocato: "#64748b", // grigio-ardesia neutro  (--status-never)
  in_corso: "#4f7bff", // blu (attivo)              (--status-playing)
  finito: "#34d399", // verde (completato)          (--status-finished)
  abbandonato: "#f06b6b", // rosso (negativo)       (--status-abandoned)
};
