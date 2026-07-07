// Layout condiviso da tutte le pagine accessibili dopo il login.
// Due colonne: barra laterale a sinistra, quindi intestazione e contenuto della pagina a destra.

import { Sidebar } from "@/layouts/Sidebar/Sidebar";
import { Header } from "@/layouts/Header/Header";
import styles from "./app-shell.module.css";

export default function AppLayout({ children }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}