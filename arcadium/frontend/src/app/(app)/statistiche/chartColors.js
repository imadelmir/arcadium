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
export const STATUS_COLORS = {
  mai_giocato: "#6b7280", // grigio
  in_corso: "#4f7bff", // blu
  finito: "#8b5cf6", // viola
  abbandonato: "#f5894c", // arancio
};