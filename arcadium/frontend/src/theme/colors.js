// The same colours as in theme.css, but as a JavaScript object.
// Useful when a library needs colours in JS instead of CSS, for example
// the charts on the statistics page (M5 - T12).
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

  // Game states (library / backlog)
  status: {
    never: "#6b7280",
    playing: "#4f7bff",
    finished: "#8b5cf6",
    abandoned: "#f5894c",
  },
};
