// =============================================================================
// Etichette Steam localizzate (lib/steamLabels.js)
// -----------------------------------------------------------------------------
// I nomi di generi e categorie arrivano dal dataset Steam SOLO in inglese
// ("Single-player", "Casual", ...). Qui teniamo la traduzione italiana e un
// piccolo helper che, quando l'interfaccia è in italiano, mostra l'etichetta
// tradotta lasciando invariato il VALORE usato dai filtri (che resta la stringa
// inglese del backend). Le voci non presenti nel dizionario restano in inglese
// (fallback sicuro), così nessuna categoria/genere "sparisce".
// =============================================================================

// --- Generi Steam -----------------------------------------------------------
export const GENRE_LABELS_IT = {
  "Action": "Azione",
  "Adventure": "Avventura",
  "Casual": "Casual",
  "Indie": "Indie",
  "Massively Multiplayer": "Multiplayer di massa",
  "Racing": "Corse",
  "RPG": "Gioco di ruolo",
  "Simulation": "Simulazione",
  "Sports": "Sport",
  "Strategy": "Strategia",
  "Free to Play": "Free to Play",
  "Early Access": "Accesso anticipato",
  "Violent": "Violento",
  "Gore": "Splatter",
  "Nudity": "Nudità",
  "Sexual Content": "Contenuti sessuali",
  "Design & Illustration": "Design e illustrazione",
  "Utilities": "Utility",
  "Video Production": "Produzione video",
  "Web Publishing": "Pubblicazione web",
  "Audio Production": "Produzione audio",
  "Photo Editing": "Fotoritocco",
  "Animation & Modeling": "Animazione e modellazione",
  "Game Development": "Sviluppo di videogiochi",
  "Education": "Istruzione",
  "Software Training": "Formazione software",
  "Accounting": "Contabilità",
  "Documentary": "Documentario",
  "Tutorial": "Tutorial",
};

// --- Categorie Steam --------------------------------------------------------
export const CATEGORY_LABELS_IT = {
  "Single-player": "Giocatore singolo",
  "Multi-player": "Multigiocatore",
  "PvP": "PvP",
  "Online PvP": "PvP online",
  "Shared/Split Screen PvP": "PvP a schermo condiviso/diviso",
  "Co-op": "Cooperativa",
  "Online Co-op": "Cooperativa online",
  "Shared/Split Screen Co-op": "Cooperativa a schermo condiviso/diviso",
  "Shared/Split Screen": "Schermo condiviso/diviso",
  "Cross-Platform Multiplayer": "Multigiocatore multipiattaforma",
  "MMO": "MMO",
  "Steam Achievements": "Obiettivi di Steam",
  "Full controller support": "Supporto completo al controller",
  "Partial Controller Support": "Supporto parziale al controller",
  "Steam Trading Cards": "Carte collezionabili di Steam",
  "Steam Cloud": "Steam Cloud",
  "Steam Workshop": "Steam Workshop",
  "Steam Leaderboards": "Classifiche di Steam",
  "Remote Play on Phone": "Remote Play su telefono",
  "Remote Play on Tablet": "Remote Play su tablet",
  "Remote Play on TV": "Remote Play su TV",
  "Remote Play Together": "Remote Play Together",
  "Family Sharing": "Condivisione in famiglia",
  "In-App Purchases": "Acquisti in-app",
  "Downloadable Content": "Contenuti scaricabili",
  "Captions available": "Sottotitoli disponibili",
  "Commentary available": "Commento disponibile",
  "Includes level editor": "Include editor di livelli",
  "VR Support": "Supporto VR",
  "VR Supported": "Supporto VR",
  "VR Only": "Solo VR",
  "Tracked Controller Support": "Supporto controller tracciati",
  "Includes Source SDK": "Include Source SDK",
  "Valve Anti-Cheat enabled": "Valve Anti-Cheat abilitato",
  "Stats": "Statistiche",
  "Steam Turn Notifications": "Notifiche di turno Steam",
  "LAN PvP": "PvP in LAN",
  "LAN Co-op": "Cooperativa in LAN",
};

// Crea la funzione da passare a `labelFor`: se l'interfaccia è in italiano
// traduce (con fallback al valore inglese se non mappato), altrimenti lascia
// l'inglese. `uiLang` è di solito i18n.language.
export function makeSteamLabelLocalizer(map, uiLang) {
  const italian = (uiLang || "it").toLowerCase().startsWith("it");
  return (value) => {
    if (!italian) return value;
    // match esatto, poi tentativo "trimmato" per sicurezza
    return map[value] ?? map[String(value).trim()] ?? value;
  };
}