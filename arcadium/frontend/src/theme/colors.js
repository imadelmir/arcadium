// Gli stessi colori di theme.css, ma come oggetto JavaScript.
// Utili quando una libreria vuole i colori in JS invece che in CSS, per esempio
// i grafici della pagina statistiche (M5-T12).
export const colors = {
  bg: "#0a0e1a",
  surface: "#121829",
  surface2: "#1a2138",
  border: "#232b44",

  text: "#e7e9f2",
  textMuted: "#8b92a8",
  textFaint: "#5b6178",

  primary: "#7c5cff",
  primaryStrong: "#6b46ff",
  accentBlue: "#4f7bff",

  success: "#34d399",
  danger: "#f06b6b",
  warning: "#f5b14c",

  // Stati del backlog: chiavi = CODICI DEL DB (allineate a lib/constants.js e a
  // StatusBadge), così i grafici possono cercare il colore per codice stato.
  status: {
    mai_giocato: "#6b7280",
    in_corso: "#4f7bff",
    finito: "#8b5cf6",
    abbandonato: "#f5894c",
  },
};
