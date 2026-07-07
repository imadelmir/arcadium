// Catalogo del negozio finto (M5 - T8).
// -----------------------------------------------------------------------------
// Dati segnaposto: permettono alla pagina del negozio di funzionare del tutto
// sui mockup prima che il backend sia collegato. Verranno sostituiti da una
// chiamata all'API Spring Boot (src/api/) in una task successiva; la forma dei
// dati corrisponde già a quella attesa dall'endpoint del negozio.
//
//   appId       id dell'app su Steam (genera la copertina + il link a Steam)
//   name        titolo del gioco
//   genres      generi (filtro "Genere" + chip sulla card)
//   priceCents  prezzo base in centesimi (0 = gratis)
//   discount    percentuale di sconto, 0..100 (0 = nessuno sconto)
//   platforms   piattaforme supportate (filtro "Piattaforma")
//   rating      valutazione: % di recensioni positive (filtro "Valutazione")
//   reviews     numero di recensioni (mostrato sulla card)
//   languages   lingue supportate (filtro "Lingua")

export const STORE_GAMES = [
  {
    appId: 1245620, name: "Elden Ring", genres: ["Azione", "RPG"],
    priceCents: 5999, discount: 40, platforms: ["Windows"], rating: 92, reviews: 720000,
    languages: ["Italiano", "English", "Español", "Français", "Deutsch"],
  },
  {
    appId: 1091500, name: "Cyberpunk 2077", genres: ["RPG", "Azione"],
    priceCents: 5999, discount: 50, platforms: ["Windows"], rating: 79, reviews: 640000,
    languages: ["Italiano", "English", "Español", "Français", "Deutsch"],
  },
  {
    appId: 292030, name: "The Witcher 3: Wild Hunt", genres: ["RPG", "Avventura"],
    priceCents: 3999, discount: 60, platforms: ["Windows"], rating: 97, reviews: 810000,
    languages: ["Italiano", "English", "Español", "Français", "Deutsch"],
  },
  {
    appId: 1174180, name: "Red Dead Redemption 2", genres: ["Azione", "Avventura"],
    priceCents: 5999, discount: 25, platforms: ["Windows"], rating: 91, reviews: 560000,
    languages: ["Italiano", "English", "Español", "Français", "Deutsch"],
  },
  {
    appId: 1145360, name: "Hades", genres: ["Roguelike", "Indie"],
    priceCents: 2499, discount: 55, platforms: ["Windows", "Mac", "Linux"], rating: 98, reviews: 300000,
    languages: ["Italiano", "English", "Español", "Français"],
  },
  {
    appId: 413150, name: "Stardew Valley", genres: ["Simulazione", "Indie"],
    priceCents: 1399, discount: 0, platforms: ["Windows", "Mac", "Linux"], rating: 98, reviews: 720000,
    languages: ["Italiano", "English", "Español", "Deutsch"],
  },
  {
    appId: 289070, name: "Sid Meier's Civilization VI", genres: ["Strategia"],
    priceCents: 4999, discount: 80, platforms: ["Windows", "Mac", "Linux"], rating: 91, reviews: 210000,
    languages: ["Italiano", "English", "Français", "Deutsch"],
  },
  {
    appId: 632360, name: "Risk of Rain 2", genres: ["Roguelike", "Azione"],
    priceCents: 2299, discount: 0, platforms: ["Windows"], rating: 96, reviews: 190000,
    languages: ["English", "Español", "Français"],
  },
  {
    appId: 271590, name: "Grand Theft Auto V", genres: ["Azione", "Avventura"],
    priceCents: 2999, discount: 30, platforms: ["Windows"], rating: 86, reviews: 1500000,
    languages: ["Italiano", "English", "Español", "Français", "Deutsch"],
  },
  {
    appId: 431960, name: "Wallpaper Engine", genres: ["Utility"],
    priceCents: 399, discount: 0, platforms: ["Windows"], rating: 98, reviews: 1100000,
    languages: ["Italiano", "English", "Español", "Deutsch"],
  },
  {
    appId: 730, name: "Counter-Strike 2", genres: ["Azione", "FPS"],
    priceCents: 0, discount: 0, platforms: ["Windows", "Linux"], rating: 88, reviews: 2000000,
    languages: ["Italiano", "English", "Español", "Français", "Deutsch"],
  },
  {
    appId: 570, name: "Dota 2", genres: ["Strategia", "MOBA"],
    priceCents: 0, discount: 0, platforms: ["Windows", "Mac", "Linux"], rating: 82, reviews: 1900000,
    languages: ["Italiano", "English", "Español", "Français", "Deutsch"],
  },
];