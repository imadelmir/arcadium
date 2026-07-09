// mockStats.js
// -----------------------------------------------------------------------------
// Sorgente dati finta della pagina Statistiche (M5-T12).
// Ha ESATTAMENTE la forma che restituirà l'endpoint "statistiche personali"
// (M4-T10): quando il backend sarà pronto basterà sostituire questo import con
// la chiamata all'API, senza toccare la UI.
//
// Nota sui colori: i colori usati DENTRO i grafici Recharts sono valori esadecimali
// (le variabili CSS "var(--...)" non funzionano negli attributi SVG). Sono presi
// dagli stessi token del tema (theme.css), così restano coerenti con l'app.

// --- Colori usati all'interno dei grafici (SVG) -----------------------------
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

// Un colore per ogni stato di completamento (barre orizzontali).
export const STATUS_COLORS = {
  completed: "#34d399", // Completati -> verde (--color-success)
  playing: "#4f7bff", // In corso   -> blu   (--status-playing)
  notStarted: "#6b7280", // Non iniziati -> grigio (--status-never)
  backlog: "#f5b14c", // Backlog   -> ambra (--color-warning)
};

// --- Dati della pagina -------------------------------------------------------
export const mockStats = {
  // KPI in cima alla pagina. "delta" = variazione dell'ultimo mese.
  totals: {
    games: 142, // giochi totali posseduti
    hours: 1847, // ore totali giocate (di tutta la vita, > ultimi 12 mesi)
    achievements: 1204, // achievement totali sbloccati
    avgCompletion: 62, // percentuale media di completamento achievement
    gamesDelta: 12, // +12 giochi questo mese
    hoursDelta: 89, // +89h questo mese
    achievementsDelta: 156, // +156 achievement questo mese
  },

  // Ore giocate negli ULTIMI 12 MESI (una voce per mese, gennaio -> dicembre).
  // "m" è l'indice del mese (0 = gennaio) e serve a tradurre l'etichetta.
  monthlyHours: [
    { m: 0, hours: 110 },
    { m: 1, hours: 96 },
    { m: 2, hours: 132 },
    { m: 3, hours: 158 },
    { m: 4, hours: 141 },
    { m: 5, hours: 120 },
    { m: 6, hours: 165 },
    { m: 7, hours: 178 },
    { m: 8, hours: 152 },
    { m: 9, hours: 188 },
    { m: 10, hours: 174 },
    { m: 11, hours: 133 },
  ],

  // Distribuzione dei giochi per genere (la somma fa 142).
  // I nomi dei generi restano nella lingua del dato, come nelle altre pagine.
  byGenre: [
    { name: "Azione", count: 34 },
    { name: "RPG", count: 28 },
    { name: "Avventura", count: 22 },
    { name: "Strategia", count: 18 },
    { name: "Indie", count: 16 },
    { name: "Sport", count: 12 },
    { name: "Simulazione", count: 12 },
  ],

  // Distribuzione per stato di completamento (la somma fa 142).
  // "key" è tradotto tramite i18n (stats.status.*); "count" è il numero di giochi.
  byStatus: [
    { key: "completed", count: 38 },
    { key: "playing", count: 24 },
    { key: "notStarted", count: 46 },
    { key: "backlog", count: 34 },
  ],

  // Giochi più giocati, in ordine di ore decrescenti.
  // "status" usa gli stessi codici di StatusBadge/GAME_STATUSES (coerenza con
  // libreria e backlog). "achUnlocked/achTotal" alimentano la barra achievement.
  topGames: [
    {
      id: 292030,
      name: "The Witcher 3: Wild Hunt",
      headerImage: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg",
      coverColor: "#b08d57",
      genre: "RPG",
      hours: 342,
      achUnlocked: 78,
      achTotal: 78,
      status: "finished",
    },
    {
      id: 1091500,
      name: "Cyberpunk 2077",
      headerImage: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
      coverColor: "#f5e050",
      genre: "RPG",
      hours: 218,
      achUnlocked: 44,
      achTotal: 57,
      status: "playing",
    },
    {
      id: 1245620,
      name: "Elden Ring",
      headerImage: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
      coverColor: "#c9a227",
      genre: "Azione",
      hours: 196,
      achUnlocked: 42,
      achTotal: 42,
      status: "finished",
    },
    {
      id: 1174180,
      name: "Red Dead Redemption 2",
      headerImage: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg",
      coverColor: "#b5423a",
      genre: "Avventura",
      hours: 154,
      achUnlocked: 33,
      achTotal: 51,
      status: "playing",
    },
    {
      id: 1086940,
      name: "Baldur's Gate 3",
      headerImage: "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg",
      coverColor: "#7a3ea0",
      genre: "RPG",
      hours: 132,
      achUnlocked: 28,
      achTotal: 54,
      status: "playing",
    },
    {
      id: 271590,
      name: "Grand Theft Auto V",
      headerImage: "https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg",
      coverColor: "#4a7c3a",
      genre: "Azione",
      hours: 98,
      achUnlocked: 61,
      achTotal: 77,
      status: "finished",
    },
  ],
};