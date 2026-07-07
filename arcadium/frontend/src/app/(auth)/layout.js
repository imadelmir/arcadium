// Layout per le pagine di autenticazione (login, registrazione).
// Queste pagine NON hanno una barra laterale: solo una scheda centrata
// su uno sfondo scuro, come nel mockup della pagina di accesso.
import styles from "./auth.module.css";

export default function AuthLayout({ children }) {
  return <main className={styles.wrap}>{children}</main>;
}
