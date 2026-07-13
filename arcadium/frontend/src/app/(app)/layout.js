// Layout del gruppo autenticato (app): sidebar a sinistra, header in alto,
// contenuto della pagina a destra.
//
// M6-T4: l'intero gruppo è protetto da RequireAuth. Senza sessione valida si
// viene rimandati a /login e nessuna pagina figlia viene montata (prima le
// pagine partivano comunque e riempivano la console di 401).
import { Sidebar } from "@/layouts/Sidebar/Sidebar";
import { Header } from "@/layouts/Header/Header";
import { RequireAuth } from "@/layouts/RequireAuth/RequireAuth";

export default function AppLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header />
        <main style={{ flex: 1, padding: "24px 32px" }}>
          <RequireAuth>{children}</RequireAuth>
        </main>
      </div>
    </div>
  );
}
