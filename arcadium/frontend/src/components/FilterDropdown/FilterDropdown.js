"use client";

// FilterDropdown
// -----------------------------------------------------------------------------
// Pillola-filtro con menu a tendina in stile "glass" (M5 - T8), come nel mockup
// del Negozio: un pulsante a pillola con etichetta + freccetta e, al clic, un
// pannello semitrasparente e sfocato con le opzioni (checkbox o radio) passate
// come children.
//
//   <FilterDropdown label="Genere" count={2}>
//     ...opzioni...
//   </FilterDropdown>
//
//   <FilterDropdown label="Ordina: Popolarità" active align="right">
//     ...opzioni...
//   </FilterDropdown>
//
// Props:
//   label   testo della pillola
//   count   numero di scelte attive (per i filtri multi-selezione: mostra un
//           pallino con il conteggio ed evidenzia la pillola)
//   active  evidenzia la pillola per i filtri a scelta singola non di default
//   align   "left" (default) | "right" — lato a cui si ancora il pannello

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import styles from "./FilterDropdown.module.css";

export function FilterDropdown({
  label,
  count = 0,
  active = false,
  align = "left",
  className = "",
  children,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const isActive = active || count > 0;

  // Chiude il pannello al clic fuori dal componente o alla pressione di Esc.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const rootClasses = [styles.root, className].filter(Boolean).join(" ");
  const panelClasses = [styles.panel, align === "right" ? styles.panelRight : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClasses} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        data-active={isActive}
        data-open={open}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.label}>{label}</span>
        {count > 0 && <span className={styles.count}>{count}</span>}
        <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
      </button>

      {open && <div className={panelClasses}>{children}</div>}
    </div>
  );
}