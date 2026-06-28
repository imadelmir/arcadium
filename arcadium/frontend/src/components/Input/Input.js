import styles from "./Input.module.css";

// Input
// -----------------------------------------------------------------------------
// A text field with an optional label, helper hint and error message. It is
// presentational (no internal state), so pass `value`/`onChange` from the page
// that uses it, plus any normal input prop (type, placeholder, required, ...).
//
//   <Input label="Email" type="email" placeholder="tu@email.com" />
//   <Input label="Cerca" iconLeft={<SearchIcon />} placeholder="Cerca giochi..." />
//   <Input label="Password" type="password" error="Password non corretta." />
//
// When `error` is set the field turns red and the message is announced to
// screen readers.

export function Input({
  label,
  hint,
  error,
  iconLeft,
  id,
  className = "",
  ...rest
}) {
  // Generate a stable id so the label and the input are linked for a11y.
  const inputId = id ?? rest.name ?? undefined;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  const fieldClasses = [styles.field, error ? styles.fieldError : "", iconLeft ? styles.hasIcon : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}

      <div className={fieldClasses}>
        {iconLeft && <span className={styles.icon}>{iconLeft}</span>}
        <input
          id={inputId}
          className={styles.input}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>

      {error ? (
        <p id={`${inputId}-error`} className={styles.error}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
