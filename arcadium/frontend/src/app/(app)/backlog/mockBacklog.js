// mockBacklog.js
// -----------------------------------------------------------------------------
// Sorgente dati della pagina BACKLOG.
// Il backlog è l'insieme dei giochi posseduti, ciascuno con il proprio stato
// (mai giocato / in corso / finito / abbandonato): lato backend è la tabella
// "backlog" (endpoint M4-T8), la stessa che alimenta la libreria. Per non
// duplicare i dati riusiamo quindi il dataset della libreria come unica fonte.
// Quando arriverà l'API basterà sostituire getBacklog() con la fetch reale.

import { getLibrary } from "../libreria/mockLibrary";

// Restituisce i giochi del backlog (oggi = giochi della libreria).
// La pagina ne farà una copia in stato locale per poterli spostare tra colonne.
export function getBacklog() {
  return getLibrary();
}

// Ordine delle colonne della board: uno stato per colonna, nell'ordine
// previsto dal modello dati (sort_order della tabella backlog_status).
// Le chiavi coincidono con quelle di GAME_STATUSES, così etichette e colori
// arrivano già dal design system.
export const BACKLOG_COLUMNS = ["never", "playing", "finished", "abandoned"];