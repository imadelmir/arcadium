import styles from "./Select.module.css";

// Select
// -----------------------------------------------------------------------------
// A styled dropdown built on the native <select>, so it stays accessible and
// works with the keyboard for free. Pass the <option>s as children. Used for
// the store filters (Genere, Prezzo, Ordina, ...).
//
//   <Select label="Ordina" defaultValue="pop">
//     <option value="pop">Popolarita</option>
//     <option value="price">Prezzo</option>
//   </Select>
//
// Note: the multi-select-with-checkboxes dropdown from the store mockup is a
// richer component; it can be built on top of this base later (M5 - T8).

export function Select({ label, error, id, className = "", children, ...rest }) {
  const selectId = id ?? rest.name ?? undefined;

  const fieldClasses = [styles.field, error ? styles.fieldError : ""].filter(Boolean).join(" ");

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}

      <div className={fieldClasses}>
        <select id={selectId} className={styles.select} aria-invalid={error ? "true" : undefined} {...rest}>
          {children}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
