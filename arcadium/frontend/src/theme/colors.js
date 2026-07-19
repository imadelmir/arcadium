// Gli stessi colori di theme.css, ma come oggetto JavaScript.
// Utili quando una libreria vuole i colori in JS invece che in CSS, per esempio
// i grafici della pagina statistiche (M5-T12).
//
// Palette "Indaco morbido": fondo/superfici/bordi/testo allineati a theme.css.
// I colori di brand e semantici (primary, status, success/danger/warning) NON
// cambiano, cosi' i grafici mantengono gli stessi accenti.
export const colors = {
  bg: "#14152e",
  surface: "#1c1d3d",
  surface2: "#26274c",
  border: "#33345e",

  text: "#eceaf6",
  textMuted: "#a2a3c4",
  textFaint: "#74759c",

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