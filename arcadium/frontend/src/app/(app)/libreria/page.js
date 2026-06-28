import styles from "../placeholder.module.css";

// "La tua libreria" page.
// This is only a placeholder for now (created in M5 - T1 to set up
// the routing). The full UI is built in the task shown on the badge.
export default function LibreriaPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>La tua libreria</h1>
      <p className={styles.subtitle}>Tutti i giochi che possiedi, in un colpo d'occhio.</p>
      <p className={styles.badge}>Pagina in costruzione · M5 - T10</p>
    </section>
  );
}
