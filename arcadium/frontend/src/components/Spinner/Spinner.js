import styles from "./Spinner.module.css";

// Spinner
// -----------------------------------------------------------------------------
// A small loading indicator to show while data is being fetched from the
// backend (catalogue, library, ...). Respects "reduced motion" via globals.css.
//
//   <Spinner />
//   <Spinner size="lg" label="Caricamento catalogo..." />
//
// size: "sm" | "md" (default) | "lg"

export function Spinner({ size = "md", label = "Caricamento...", className = "" }) {
  return (
    <span className={[styles.wrap, className].filter(Boolean).join(" ")} role="status">
      <span className={[styles.spinner, styles[size]].join(" ")} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}
