// mockWishlist.js
// -----------------------------------------------------------------------------
// Dataset finto della WISHLIST (giochi che l'utente desidera).
// La forma dei campi rispecchia quella attesa dall'endpoint wishlist (M4-T7):
// quando l'API sarà pronta basterà sostituire questa sorgente con una fetch,
// lasciando invariata la pagina.
//
// Campi di ogni gioco:
//   appId            -> chiave del gioco su Steam (usata anche per la cover)
//   name             -> titolo mostrato nella riga
//   headerImage      -> copertina header di Steam
//   tags             -> due/tre etichette brevi (genere/tema), come sottotitolo
//   priceCents       -> prezzo pieno in centesimi (0 = gioco gratis)
//   discount         -> percentuale di sconto attiva ora (0 = nessuno sconto)
//   priceAlert       -> true se l'utente ha attivato la notifica calo prezzo
//   recentlyDropped  -> true se il prezzo è sceso di recente (per l'avviso in alto)

// Scorciatoia per l'URL della cover header di Steam.
const cover = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

export const mockWishlist = [
  {
    appId: 271590,
    name: "Grand Theft Auto V",
    headerImage: cover(271590),
    tags: ["Azione", "Open World"],
    priceCents: 2999,
    discount: 50, // -> 14,99 €
    priceAlert: true,
    recentlyDropped: true, // alimenta l'avviso "sceso di prezzo" in cima
  },
  {
    appId: 1245620,
    name: "Elden Ring",
    headerImage: cover(1245620),
    tags: ["GDR", "Soulslike"],
    priceCents: 5999,
    discount: 0,
    priceAlert: true, // nessuno sconto ora: l'utente aspetta un calo
    recentlyDropped: false,
  },
  {
    appId: 252490,
    name: "Rust",
    headerImage: cover(252490),
    tags: ["Sopravvivenza", "Multiplayer"],
    priceCents: 3999,
    discount: 50, // -> 19,99 €
    priceAlert: false,
    recentlyDropped: false,
  },
  {
    appId: 413150,
    name: "Stardew Valley",
    headerImage: cover(413150),
    tags: ["Simulazione", "Indie"],
    priceCents: 1399,
    discount: 30, // -> 9,79 €
    priceAlert: false,
    recentlyDropped: false,
  },
  {
    appId: 1091500,
    name: "Cyberpunk 2077",
    headerImage: cover(1091500),
    tags: ["GDR", "Azione"],
    priceCents: 5999,
    discount: 60, // -> 23,99 €
    priceAlert: true,
    recentlyDropped: false,
  },
  {
    appId: 730,
    name: "Counter-Strike 2",
    headerImage: cover(730),
    tags: ["FPS", "Competitivo"],
    priceCents: 0, // gratis
    discount: 0,
    priceAlert: true,
    recentlyDropped: false,
  },
];

// Restituisce l'intera wishlist (segnaposto dell'eventuale chiamata API futura).
export function getWishlist() {
  return mockWishlist;
}