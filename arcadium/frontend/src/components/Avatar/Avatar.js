import styles from "./Avatar.module.css";

// Avatar
// -----------------------------------------------------------------------------
// L'immagine del profilo circolare nella barra superiore. Se non è presente
// un'immagine, viene mostrato un riquadro con le iniziali della persona sul
// gradiente del marchio, in modo che non appaia mai come un elemento mancante.
//
//   <Avatar name="Luca Rossi" />
//   <Avatar name="Luca Rossi" src="/avatars/luca.jpg" size="lg" />
//
// size: "sm" | "md" (predefinito) | "lg"

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
