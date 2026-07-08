// mockLibrary.js
// -----------------------------------------------------------------------------
// Dataset finto della LIBRERIA personale (giochi posseduti dall'utente).
// La forma dei campi rispecchia quella attesa dall'endpoint "giochi per utente"
// del backend (M4-T9): quando l'API sarà pronta basterà sostituire questa
// sorgente con una fetch, lasciando invariata la pagina.
//
// Campi di ogni gioco:
//   appId                -> chiave del gioco su Steam (usata anche per la cover)
//   name                 -> titolo mostrato nella card
//   headerImage          -> copertina header di Steam
//   status               -> stato nel backlog: "never" | "playing" | "finished" | "abandoned"
//   playtimeMinutes      -> minuti totali giocati (li formattiamo in ore nella pagina)
//   achievementsUnlocked -> achievement sbloccati
//   achievementsTotal    -> achievement totali del gioco (0 = gioco senza achievement)
//   genres               -> generi principali (restano nella lingua del dato)
//   lastPlayedAt         -> ultima sessione (ISO date), per ordinamenti futuri

// Piccola scorciatoia per costruire l'URL della cover header di Steam.
const cover = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

export const mockLibrary = [
  {
    appId: 292030,
    name: "The Witcher 3: Wild Hunt",
    headerImage: cover(292030),
    status: "finished",
    playtimeMinutes: 6120, // 102 ore
    achievementsUnlocked: 48,
    achievementsTotal: 78,
    genres: ["GDR", "Avventura"],
    lastPlayedAt: "2026-05-14",
  },
  {
    appId: 1091500,
    name: "Cyberpunk 2077",
    headerImage: cover(1091500),
    status: "playing",
    playtimeMinutes: 2745, // 45,7 ore
    achievementsUnlocked: 21,
    achievementsTotal: 45,
    genres: ["GDR", "Azione"],
    lastPlayedAt: "2026-06-25",
  },
  {
    appId: 1145360,
    name: "Hades",
    headerImage: cover(1145360),
    status: "playing",
    playtimeMinutes: 1560, // 26 ore
    achievementsUnlocked: 30,
    achievementsTotal: 49,
    genres: ["Roguelike", "Azione"],
    lastPlayedAt: "2026-06-28",
  },
  {
    appId: 413150,
    name: "Stardew Valley",
    headerImage: cover(413150),
    status: "finished",
    playtimeMinutes: 4890, // 81,5 ore
    achievementsUnlocked: 40,
    achievementsTotal: 40,
    genres: ["Simulazione", "Indie"],
    lastPlayedAt: "2026-04-02",
  },
  {
    appId: 1174180,
    name: "Red Dead Redemption 2",
    headerImage: cover(1174180),
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
    status: "finished",
    playtimeMinutes: 780, // 13 ore
    achievementsUnlocked: 51,
    achievementsTotal: 51,
    genres: ["Puzzle", "Platform"],
    lastPlayedAt: "2026-03-19",
  },
  {
    appId: 105600,
    name: "Terraria",
    headerImage: cover(105600),
    status: "abandoned",
    playtimeMinutes: 930, // 15,5 ore
    achievementsUnlocked: 22,
    achievementsTotal: 104,
    genres: ["Sandbox", "Avventura"],
    lastPlayedAt: "2026-02-08",
  },
  {
    appId: 570,
    name: "Dota 2",
    headerImage: cover(570),
    status: "abandoned",
    playtimeMinutes: 12300, // 205 ore
    achievementsUnlocked: 0,
    achievementsTotal: 0, // gioco senza achievement
    genres: ["MOBA", "Strategia"],
    lastPlayedAt: "2026-01-30",
  },
  {
    appId: 1174180 + 1, // placeholder appId inesistente per testare la cover di fallback
    name: "Gioco Senza Cover",
    headerImage: null,
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