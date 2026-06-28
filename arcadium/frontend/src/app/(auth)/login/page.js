import Link from "next/link";
import styles from "../auth-card.module.css";

// "Accedi" (login) page.
// Placeholder card for now. The real form with email/password and the
// call to the backend is built in M5 - T5.
export default function LoginPage() {
  return (
    <div className={styles.card}>
      <p className={styles.brand}>ARCADIUM</p>
      <h1 className={styles.title}>Bentornato</h1>
      <p className={styles.subtitle}>Accedi al tuo account Arcadium.</p>
      <p className={styles.badge}>Form di accesso · M5 - T5</p>
      <p className={styles.alt}>
        Non hai un account?{" "}
        <Link className={styles.link} href="/registrazione">
          Registrati
        </Link>
      </p>
    </div>
  );
}
