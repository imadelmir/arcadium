// Shown when the user opens a URL that does not exist (404).
import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.wrap}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Pagina non trovata</h1>
      <p className={styles.text}>
        La pagina che cerchi non esiste o è stata spostata.
      </p>
      <Link className={styles.link} href="/panoramica">
        Torna alla Panoramica
      </Link>
    </main>
  );
}
