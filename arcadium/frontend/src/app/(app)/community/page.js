import styles from "../placeholder.module.css";

// "Community" page.
// This is only a placeholder for now (created in M5 - T1 to set up
// the routing). The full UI is built in the task shown on the badge.
export default function CommunityPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Community</h1>
      <p className={styles.subtitle}>Confronta libreria e achievement con altri giocatori.</p>
      <p className={styles.badge}>Pagina in costruzione · M5</p>
    </section>
  );
}
