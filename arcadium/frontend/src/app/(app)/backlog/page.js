import styles from "../placeholder.module.css";

// "Backlog" page.
// This is only a placeholder for now (created in M5 - T1 to set up
// the routing). The full UI is built in the task shown on the badge.
export default function BacklogPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Backlog</h1>
      <p className={styles.subtitle}>Organizza i giochi per stato: in corso, finito, abbandonato.</p>
      <p className={styles.badge}>Pagina in costruzione · M5 - T11</p>
    </section>
  );
}
