import styles from "./StatusBadge.module.css";

// StatusBadge
// -----------------------------------------------------------------------------
// The coloured state pill shown on every game in the library and backlog.
// You give it the status code; it prints the right Italian label and colour,
// so the four states stay consistent across the whole app.
//
//   <StatusBadge status="playing" />     ->  • In corso
//   <StatusBadge status="finished" />    ->  • Finito
//
// status: "never" | "playing" | "finished" | "abandoned"

// One place that defines label + colour for each state. If a new state is ever
// added, this is the only spot to change.
export const GAME_STATUSES = {
  never: { label: "Mai giocato", className: "never" },
  playing: { label: "In corso", className: "playing" },
  finished: { label: "Finito", className: "finished" },
  abandoned: { label: "Abbandonato", className: "abandoned" },
};

export function StatusBadge({ status = "never", className = "", ...rest }) {
  const config = GAME_STATUSES[status] ?? GAME_STATUSES.never;
  const classes = [styles.badge, styles[config.className], className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      <span className={styles.dot} aria-hidden="true" />
      {config.label}
    </span>
  );
}
