// Layout shared by all the "logged-in" pages (the ones with the sidebar).
// For now it only shows the brand name and a thin top bar, so the pages
// are not completely empty. The real sidebar, header and search bar are
// built later in task M5 - T4.

import Link from "next/link";
import styles from "./app-shell.module.css";

export default function AppLayout({ children }) {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/panoramica" className={styles.brand}>
          ARCADIUM
        </Link>
        {/* TODO (M5 - T4): real sidebar, header and search bar */}
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
