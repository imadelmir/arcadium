import styles from "../placeholder.module.css";

// "Negozio" page.
// This is only a placeholder for now (created in M5 - T1 to set up
// the routing). The full UI is built in the task shown on the badge.
export default function NegozioPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Negozio</h1>
      <p className={styles.subtitle}>Esplora il catalogo Steam, filtra e acquista in un clic.</p>
      <p className={styles.badge}>Pagina in costruzione · M5 - T8</p>
    </section>
  );
}
