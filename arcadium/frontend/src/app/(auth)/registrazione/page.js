import Link from "next/link";
import styles from "../auth-card.module.css";

// "Registrazione" (sign up) page.
// Placeholder card for now. The real form is built in M5 - T5.
export default function RegistrazionePage() {
  return (
    <div className={styles.card}>
      <p className={styles.brand}>ARCADIUM</p>
      <h1 className={styles.title}>Crea il tuo account</h1>
      <p className={styles.subtitle}>Inizia a organizzare la tua libreria.</p>
      <p className={styles.badge}>Form di registrazione · M5 - T5</p>
      <p className={styles.alt}>
        Hai già un account?{" "}
        <Link className={styles.link} href="/login">
          Accedi
        </Link>
      </p>
    </div>
  );
}
