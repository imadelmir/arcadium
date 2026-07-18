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
// restano sempre visibili. Le testate delle singole pagine si agganciano in alto
// con `position: sticky`, che funziona proprio perché l'area di scorrimento è
// <main>.
import { Sidebar } from "@/layouts/Sidebar/Sidebar";
import { Header } from "@/layouts/Header/Header";
import { RequireAuth } from "@/layouts/RequireAuth/RequireAuth";

export default function AppLayout({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh" }}>
        <Header />
        {/* Nessun padding in alto: le testate sticky partono a filo, altrimenti
            il contenuto scorrerebbe visibile nella striscia sopra di esse. */}
        <main style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 32px 24px" }}>
          <RequireAuth>{children}</RequireAuth>
        </main>
      </div>
    </div>
  );
}
