// Layout shared by all the logged-in pages.
// Two columns: sidebar on the left, then header + page content on the right.

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