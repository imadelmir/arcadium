import styles from "../placeholder.module.css";

// "Impostazioni" page.
// This is only a placeholder for now (created in M5 - T1 to set up
// the routing). The full UI is built in the task shown on the badge.
export default function ImpostazioniPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Impostazioni</h1>
      <p className={styles.subtitle}>Account, lingua e collegamento con Steam.</p>
      <p className={styles.badge}>Pagina in costruzione · M5 - T15</p>
    </section>
  );
}
