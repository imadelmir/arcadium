"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styles from "./Tabs.module.css";

// Su client usiamo useLayoutEffect (misura PRIMA che il browser dipinga, così
// al primo caricamento la pill non "cresce" dall'angolo); su server ripieghiamo
// su useEffect per non far comparire il warning SSR.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Tabs
// -----------------------------------------------------------------------------
// Le "pillole" di filtro orizzontali dei mockup ("Tutti / Mai giocato / In corso
// / Finito / Abbandonato"). È l'unico componente base che tiene uno stato, quindi
// è un Client Component ("use client" in cima).
//
// Modalità d'uso:
//   - Non controllato: passa `defaultValue` e leggi la scelta con `onChange`.
//       <Tabs items={items} defaultValue="all" onChange={setFilter} />
//   - Controllato: lo piloti tu con `value` + `onChange`.
//       <Tabs items={items} value={filter} onChange={setFilter} />
//
// items: [{ value: string, label: string }]
//
// EFFETTO "acqua" come nella Sidebar: c'è UNA SOLA pill di vetro. Scivola sotto
// la tab sotto il mouse e, quando il mouse esce, TORNA sulla tab selezionata.
// È lo stesso elemento a rappresentare hover E selezione, quindi cambiando tab
// (es. da "Finito" a "In corso") la pill FLUISCE invece di saltare.

export function Tabs({ items = [], value, defaultValue, onChange, className = "" }) {
  // Controllato quando arriva la prop `value`; altrimenti gestiamo noi lo stato.
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const active = isControlled ? value : internal;

  // Contenitore: serve per misurare le tab e per capire se il focus è uscito.
  const listRef = useRef(null);

  // Valore della tab sotto il mouse (null = mouse fuori dalla barra).
  const [hovered, setHovered] = useState(null);
  // Rettangolo della pill (posizione/dimensioni misurate dalla tab bersaglio).
  const [pill, setPill] = useState(null);

  // La pill sta sulla tab sotto il mouse; se il mouse è fuori, sull'attiva.
  const target = hovered ?? active;
  // Riferimento sempre aggiornato, così `measure` può restare stabile.
  const targetRef = useRef(target);
  targetRef.current = target;

  function select(next) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  // Misura la tab bersaglio e sposta lì la pill: il "flow" lo fa la transizione
  // CSS. offsetLeft/offsetTop sono relativi al contenitore (position: relative),
  // così funziona anche se le tab vanno a capo su schermi stretti.
  const measure = useCallback(() => {
    const el = listRef.current?.querySelector(
      `[data-value="${targetRef.current}"]`
    );
    if (!el) return;
    setPill({
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
  }, []);

  // Riposiziona quando cambia la tab bersaglio o la lista di tab.
  useIsoLayoutEffect(() => {
    measure();
  }, [target, items, measure]);

  // Riposiziona se la barra cambia dimensione (resize finestra, sidebar, a capo).
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    return () => ro.disconnect();
  }, [measure]);

  // Torna sull'attiva quando il focus esce DAVVERO dalla barra (e non è solo
  // passato da una tab all'altra con la tastiera).
  function handleBlur(event) {
    const goingTo = event.relatedTarget;
    if (goingTo && listRef.current?.contains(goingTo)) return;
    setHovered(null);
  }

  return (
    <div
      ref={listRef}
      className={[styles.tabs, className].filter(Boolean).join(" ")}
      role="tablist"
      // onMouseLeave sul contenitore (non sulle singole tab): così passando da
      // una tab all'altra la pill non torna mai indietro a metà strada.
      onMouseLeave={() => setHovered(null)}
      onBlur={handleBlur}
    >
      {/* UNA SOLA pill di vetro che scorre (come nella Sidebar). Decorativa:
          non intercetta i click e sta dietro ai pulsanti. */}
      <span
        aria-hidden="true"
        className={styles.pill}
        data-hidden={!pill}
        style={
          pill
            ? {
                transform: `translate(${pill.left}px, ${pill.top}px)`,
                width: pill.width,
                height: pill.height,
              }
            : undefined
        }
      />

      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            data-value={item.value}
            aria-selected={isActive}
            className={[styles.tab, isActive ? styles.active : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => select(item.value)}
            // Mouse sulla tab / focus da tastiera → la pill fluisce fin qui.
            onMouseEnter={() => setHovered(item.value)}
            onFocus={() => setHovered(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}