"use client";

import { useState } from "react";
import styles from "./Tabs.module.css";

// Tabs
// -----------------------------------------------------------------------------
// The horizontal filter pills from the mockups ("Tutti / Mai giocato / In corso
// / Finito / Abbandonato"). This is the only base component that holds state,
// so it is a Client Component ("use client" at the top).
//
// It works in two ways:
//   - Uncontrolled: give it `defaultValue` and read the choice via `onChange`.
//       <Tabs items={items} defaultValue="all" onChange={setFilter} />
//   - Controlled: drive it yourself with `value` + `onChange`.
//       <Tabs items={items} value={filter} onChange={setFilter} />
//
// items: [{ value: string, label: string }]

export function Tabs({ items = [], value, defaultValue, onChange, className = "" }) {
  // Controlled when a `value` prop is passed; otherwise we keep our own state.
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const active = isControlled ? value : internal;

  function select(next) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  return (
    <div className={[styles.tabs, className].filter(Boolean).join(" ")} role="tablist">
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={[styles.tab, isActive ? styles.active : ""].filter(Boolean).join(" ")}
            onClick={() => select(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
