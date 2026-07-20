// Layout del gruppo autenticato (app): sidebar a sinistra, header in alto,
// contenuto della pagina a destra.
//
// M6-T4: l'intero gruppo è protetto da RequireAuth. Senza sessione valida si
// viene rimandati a /login e nessuna pagina figlia viene montata (prima le
// pagine partivano comunque e riempivano la console di 401).
//
// Change request layout: la finestra NON scorre più nel suo insieme. Il
// contenitore occupa esattamente l'altezza della finestra e l'unica area che
// scorre è <main>: così sidebar (navigazione) e header (utente, lingua, social)
// restano sempre visibili.
//
// Change request responsive: la struttura e gli stili si sono spostati in
// AppShell, un componente CLIENT. Motivo: sotto i 768px la sidebar diventa un
// pannello a scomparsa e serve dello stato (aperto/chiuso) condiviso fra
// sidebar, header e velatura — cosa impossibile in un componente server come
// questo. Qui resta solo il montaggio, così il layout non diventa client
// inutilmente e le pagine figlie conservano il rendering server dove possibile.
import { AppShell } from "@/layouts/AppShell/AppShell";

export default function AppLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
