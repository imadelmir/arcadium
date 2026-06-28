// Layout for the authentication pages (login, registrazione).
// These pages have NO sidebar: just a centred card on a dark background,
// like the login mockup.
import styles from "./auth.module.css";

export default function AuthLayout({ children }) {
  return <main className={styles.wrap}>{children}</main>;
}
