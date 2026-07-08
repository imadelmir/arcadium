// mockLibrary.js
// -----------------------------------------------------------------------------
// Dataset finto della LIBRERIA personale (giochi posseduti dall'utente).
// Usato anche dalla pagina Backlog. La forma dei campi rispecchia quella attesa
// dall'endpoint "giochi per utente" (M4-T9): quando l'API sarà pronta basterà
// sostituire questa sorgente con una fetch, lasciando invariate le pagine.
//
// Campi di ogni gioco:
//   appId                -> chiave del gioco su Steam (usata anche per la cover)
//   name                 -> titolo mostrato nella card/riga
//   headerImage          -> copertina header di Steam
//   coverColor           -> colore rappresentativo del gioco (fuso nello sfondo,
//                           come nella pagina dettaglio)
//   status               -> "never" | "playing" | "finished" | "abandoned"
//   playtimeMinutes      -> minuti totali giocati (formattati in ore nella UI)
//   achievementsUnlocked -> achievement sbloccati
//   achievementsTotal    -> achievement totali (0 = gioco senza achievement)
//   genres               -> generi principali
//   lastPlayedAt         -> ultima sessione (ISO date), per ordinamenti futuri

// Scorciatoia per l'URL della cover header di Steam.
const cover = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

export const mockLibrary = [
  {
    appId: 292030,
    name: "The Witcher 3: Wild Hunt",
    headerImage: cover(292030),
    coverColor: "#b04a3a",
    status: "finished",
    playtimeMinutes: 6120,
    achievementsUnlocked: 48,
    achievementsTotal: 78,
    genres: ["GDR", "Avventura"],
    lastPlayedAt: "2026-05-14",
  },
  {
    appId: 1091500,
    name: "Cyberpunk 2077",
    headerImage: cover(1091500),
    coverColor: "#e0c94a",
    status: "playing",
    playtimeMinutes: 2745,
    achievementsUnlocked: 21,
    achievementsTotal: 45,
    genres: ["GDR", "Azione"],
    lastPlayedAt: "2026-06-25",
  },
  {
    appId: 1145360,
    name: "Hades",
    headerImage: cover(1145360),
    coverColor: "#c0392b",
    status: "playing",
    playtimeMinutes: 1560,
    achievementsUnlocked: 30,
    achievementsTotal: 49,
    genres: ["Roguelike", "Azione"],
    lastPlayedAt: "2026-06-28",
  },
  {
    appId: 413150,
    name: "Stardew Valley",
    headerImage: cover(413150),
    coverColor: "#5aa84a",
    status: "finished",
    playtimeMinutes: 4890,
    achievementsUnlocked: 40,
    achievementsTotal: 40,
    genres: ["Simulazione", "Indie"],
    lastPlayedAt: "2026-04-02",
  },
  {
    appId: 1174180,
    name: "Red Dead Redemption 2",
    headerImage: cover(1174180),
    coverColor: "#b5342a",
    status: "never",
    playtimeMinutes: 0,
    achievementsUnlocked: 0,
    achievementsTotal: 51,
    genres: ["Avventura", "Azione"],
    lastPlayedAt: null,
  },
  {
    appId: 620,
    name: "Portal 2",
    headerImage: cover(620),
    coverColor: "#3e88c9",
    status: "finished",
    playtimeMinutes: 780,
    achievementsUnlocked: 51,
    achievementsTotal: 51,
    genres: ["Puzzle", "Platform"],
    lastPlayedAt: "2026-03-19",
  },
  {
    appId: 105600,
    name: "Terraria",
    headerImage: cover(105600),
    coverColor: "#4f9a52",
    status: "abandoned",
    playtimeMinutes: 930,
    achievementsUnlocked: 22,
    achievementsTotal: 104,
    genres: ["Sandbox", "Avventura"],
    lastPlayedAt: "2026-02-08",
  },
  {
    appId: 570,
    name: "Dota 2",
    headerImage: cover(570),
    coverColor: "#b5502a",
    status: "abandoned",
    playtimeMinutes: 12300,
    achievementsUnlocked: 0,
    achievementsTotal: 0,
    genres: ["MOBA", "Strategia"],
    lastPlayedAt: "2026-01-30",
  },
  {
    appId: 1174181, // placeholder per testare la cover di fallback
    name: "Gioco Senza Cover",
    headerImage: null,
    coverColor: "#6b7280",
    status: "never",
    playtimeMinutes: 0,
    achievementsUnlocked: 0,
    achievementsTotal: 12,
    genres: ["Indie"],
    lastPlayedAt: null,
  },
];

// Restituisce l'intera libreria (segnaposto dell'eventuale chiamata API futura).
export function getLibrary() {
  return mockLibrary;
}