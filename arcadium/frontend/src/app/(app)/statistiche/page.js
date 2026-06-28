import styles from "../placeholder.module.css";

// "Le tue statistiche" page.
// This is only a placeholder for now (created in M5 - T1 to set up
// the routing). The full UI is built in the task shown on the badge.
export default function StatistichePage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Le tue statistiche</h1>
      <p className={styles.subtitle}>Ore di gioco, completamenti e achievement.</p>
      <p className={styles.badge}>Pagina in costruzione · M5 - T12</p>
    </section>
  );
}
