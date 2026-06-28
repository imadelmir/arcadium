import styles from "./Card.module.css";

// Card
// -----------------------------------------------------------------------------
// A surface box: the dark panel used for cards, rows and sections in the
// mockups. Add `hoverable` to make it lift slightly on hover (useful for
// clickable game cards). Use `padding="none"` when the content draws its own
// edges (for example an image that bleeds to the border).
//
//   <Card>...</Card>
//   <Card hoverable onClick={...}>...</Card>
//   <Card padding="none"><img ... /></Card>
//
// padding: "md" (default) | "lg" | "none"

export function Card({
  hoverable = false,
  padding = "md",
  className = "",
  children,
  ...rest
}) {
  const paddingClass =
    padding === "lg" ? styles.padLg : padding === "none" ? styles.padNone : styles.padMd;

  const classes = [styles.card, paddingClass, hoverable ? styles.hoverable : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
