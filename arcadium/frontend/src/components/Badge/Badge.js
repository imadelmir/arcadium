import styles from "./Badge.module.css";

// Badge
// -----------------------------------------------------------------------------
// Small pill label for short bits of meta (a tag, a count, "Gratis", "-50%").
// For the library/backlog game states use <StatusBadge> instead, which already
// knows the right colours and Italian labels.
//
//   <Badge>Open World</Badge>
//   <Badge tone="success">-50%</Badge>
//   <Badge tone="primary" dot>Collegato</Badge>
//
// tone: "neutral" (default) | "primary" | "success" | "danger" | "warning"

export function Badge({ tone = "neutral", dot = false, className = "", children, ...rest }) {
  const classes = [styles.badge, styles[tone], className].filter(Boolean).join(" ");

  return (
    <span className={classes} {...rest}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
