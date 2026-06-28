import styles from "./Avatar.module.css";

// Avatar
// -----------------------------------------------------------------------------
// The round user picture in the top bar. If there is no image it falls back to
// the person's initials on the brand gradient, so it never looks broken.
//
//   <Avatar name="Luca Rossi" />
//   <Avatar name="Luca Rossi" src="/avatars/luca.jpg" size="lg" />
//
// size: "sm" | "md" (default) | "lg"

function initialsFrom(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name = "", src, size = "md", className = "", ...rest }) {
  const classes = [styles.avatar, styles[size], className].filter(Boolean).join(" ");

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={classes} {...rest} />;
  }

  return (
    <span className={classes} aria-label={name} role="img" {...rest}>
      {initialsFrom(name)}
    </span>
  );
}
