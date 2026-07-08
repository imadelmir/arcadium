// mockGameDetail.js
// -----------------------------------------------------------------------------
// Catalogo FINTO (segnaposto) per la pagina di dettaglio gioco (M5 - T9).
//
// La forma di ogni oggetto ricalca 1:1 i campi della tabella `games` del
// database e quelli che restituira' l'endpoint dettaglio del backend
// (M4 - T6). Quando l'API sara' pronta bastera' sostituire `getGameById`
// con una fetch verso `src/api/`: la pagina non cambia di una riga.
//
// I prezzi sono in CENTESIMI (interi) per evitare errori di arrotondamento,
// esattamente come nel negozio (M5 - T8). Le immagini usano il CDN pubblico
// di Steam a partire dall'appId, cosi' le cover caricano davvero; se un URL
// fallisce, il componente <GameImage> mostra comunque il fallback.

// Piccola utility interna: costruisce gli URL immagine di Steam dall'appId.
// Non e' esportata perche' serve solo a popolare i dati finti qui sotto.
const steamCdn = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}`;

// Catalogo finto indicizzato per appId (chiave = stringa, come arriva dall'URL).
const GAMES = {
  1245620: {
    appId: 1245620,
    name: "ELDEN RING",
    headerImage: `${steamCdn(1245620)}/header.jpg`,
    // Immagini extra per la striscia multimediale (percorsi CDN prevedibili).
    screenshots: [
      `${steamCdn(1245620)}/library_hero.jpg`,
      `${steamCdn(1245620)}/capsule_616x353.jpg`,
    ],
    aboutTheGame:
      "Sali sul trono di Senzaluce e viaggia nell'Interregno, un mondo aperto sconfinato creato da Hidetaka Miyazaki e George R. R. Martin. Esplora rovine sterminate, affronta boss leggendari e forgia il tuo percorso attraverso un gioco di ruolo d'azione dalla difficolta' leggendaria.",
    priceCents: 5999, // 59,99 €
    discount: 40, // -40%
    releaseDate: "2022-02-25",
    developers: ["FromSoftware Inc."],
    publishers: ["Bandai Namco Entertainment"],
    genres: ["Action", "RPG", "Open World"],
    tags: ["Souls-like", "Dark Fantasy", "Difficile", "Atmosferico", "Esplorazione"],
    categories: ["Giocatore singolo", "Multigiocatore online", "Achievement Steam"],
    platforms: { windows: true, mac: false, linux: false },
    positive: 512340,
    negative: 41220,
    metacriticScore: 96,
    achievementsCount: 42,
    website: "https://www.eldenring.com",
  },

  292030: {
    appId: 292030,
    name: "The Witcher 3: Wild Hunt",
    headerImage: `${steamCdn(292030)}/header.jpg`,
    screenshots: [
      `${steamCdn(292030)}/library_hero.jpg`,
      `${steamCdn(292030)}/capsule_616x353.jpg`,
    ],
    aboutTheGame:
      "Sei Geralt di Rivia, cacciatore di mostri professionista. In un mondo aperto devastato dalla guerra, cerchi Ciri, la Figlia della Profezia. Ogni scelta pesa: quest ramificate, personaggi memorabili e un'ambientazione dark fantasy tra le piu' acclamate di sempre.",
    priceCents: 2999,
    discount: 70,
    releaseDate: "2015-05-18",
    developers: ["CD PROJEKT RED"],
    publishers: ["CD PROJEKT RED"],
    genres: ["RPG", "Open World", "Adventure"],
    tags: ["Storia ricca", "Scelte narrative", "Dark Fantasy", "Mondo aperto"],
    categories: ["Giocatore singolo", "Achievement Steam", "Supporto controller"],
    platforms: { windows: true, mac: false, linux: true },
    positive: 389210,
    negative: 8940,
    metacriticScore: 93,
    achievementsCount: 78,
    website: "https://www.thewitcher.com",
  },

  570: {
    appId: 570,
    name: "Dota 2",
    headerImage: `${steamCdn(570)}/header.jpg`,
    screenshots: [
      `${steamCdn(570)}/library_hero.jpg`,
      `${steamCdn(570)}/capsule_616x353.jpg`,
    ],
    aboutTheGame:
      "Ogni giorno milioni di giocatori si sfidano nel MOBA piu' profondo che esista. Due squadre da cinque, oltre cento eroi unici, partite che non si somigliano mai. Gratuito per sempre: tutti gli eroi sono gia' sbloccati.",
    priceCents: 0, // Gratis
    discount: 0,
    releaseDate: "2013-07-09",
    developers: ["Valve"],
    publishers: ["Valve"],
    genres: ["Strategy", "Action", "Free to Play"],
    tags: ["MOBA", "Competitivo", "Multigiocatore", "Difficile", "eSport"],
    categories: ["Multigiocatore online", "Cooperativo", "Achievement Steam"],
    platforms: { windows: true, mac: true, linux: true },
    positive: 1640500,
    negative: 320180,
    metacriticScore: 90,
    achievementsCount: 0,
    website: "https://www.dota2.com",
  },

  1174180: {
    appId: 1174180,
    name: "Red Dead Redemption 2",
    headerImage: `${steamCdn(1174180)}/header.jpg`,
    screenshots: [
      `${steamCdn(1174180)}/library_hero.jpg`,
      `${steamCdn(1174180)}/capsule_616x353.jpg`,
    ],
    aboutTheGame:
      "America, 1899. Arthur Morgan e la banda di Van der Linde sono in fuga. Un'epopea western in un mondo aperto vastissimo e vivo, dove ogni azione ha conseguenze. Un racconto sulla fine di un'era, tra lealta' e sopravvivenza.",
    priceCents: 5999,
    discount: 0,
    releaseDate: "2019-12-05",
    developers: ["Rockstar Games"],
    publishers: ["Rockstar Games"],
    genres: ["Action", "Adventure", "Open World"],
    tags: ["Western", "Storia ricca", "Realistico", "Atmosferico", "Cavalli"],
    categories: ["Giocatore singolo", "Multigiocatore online", "Supporto controller"],
    platforms: { windows: true, mac: false, linux: false },
    positive: 298700,
    negative: 22140,
    metacriticScore: 93,
    achievementsCount: 51,
    website: "https://www.rockstargames.com/reddeadredemption2",
  },
};

// Restituisce il gioco per appId (l'appId dell'URL e' sempre una stringa).
// Ritorna `null` se non esiste: la pagina mostrera' lo stato "non trovato".
export function getGameById(appId) {
  return GAMES[String(appId)] ?? null;
}

// Elenco completo (utile in seguito per generateStaticParams o test).
export const ALL_GAMES = Object.values(GAMES);