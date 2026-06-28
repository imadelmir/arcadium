import styles from "./Button.module.css";

// Button
// -----------------------------------------------------------------------------
// The one button used everywhere. Pick a look with `variant` and a size with
// `size`. It is just a styled <button>, so every normal button prop still works
// (onClick, type, disabled, aria-*, ...). It does NOT use state, so it can be
// used from both server and client components.
//
//   <Button onClick={...}>Accedi</Button>
//   <Button variant="secondary" size="sm">Annulla</Button>
//   <Button iconLeft={<PlusIcon />} fullWidth>Aggiungi alla wishlist</Button>
//
// variant: "primary" (default) | "secondary" | "ghost" | "danger"
// size:    "md" (default) | "sm"

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  iconLeft,
  iconRight,
  type = "button",
  className = "",
  children,
  ...rest
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {iconLeft && <span className={styles.icon}>{iconLeft}</span>}
      {children}
      {iconRight && <span className={styles.icon}>{iconRight}</span>}
    </button>
  );
}
