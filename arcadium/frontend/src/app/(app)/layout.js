// Layout del gruppo autenticato (app): sidebar a sinistra, header in alto,
// contenuto della pagina a destra.
import { Sidebar } from "@/layouts/Sidebar/Sidebar";
import { Header } from "@/layouts/Header/Header";

export default function AppLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header />
        <main style={{ flex: 1, padding: "24px 32px" }}>{children}</main>
      </div>
    </div>
  );
}