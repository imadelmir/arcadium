import styles from "../placeholder.module.css";

// "La tua wishlist" page.
// This is only a placeholder for now (created in M5 - T1 to set up
// the routing). The full UI is built in the task shown on the badge.
export default function WishlistPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>La tua wishlist</h1>
      <p className={styles.subtitle}>I giochi che desideri, con avvisi quando il prezzo scende.</p>
      <p className={styles.badge}>Pagina in costruzione · M5 - T10</p>
    </section>
  );
}
