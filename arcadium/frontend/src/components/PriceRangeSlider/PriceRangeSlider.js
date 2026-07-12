"use client";

// PriceRangeSlider — slider a DOPPIA maniglia (min/max) per filtrare i giochi
// per fascia di prezzo (change request Negozio).
// -----------------------------------------------------------------------------
// Tecnica: due <input type="range"> sovrapposti sullo stesso binario. Uno
// controlla il prezzo minimo, l'altro il prezzo massimo; il tratto colorato fra
// le due maniglie evidenzia l'intervallo selezionato. Le maniglie non possono
// scavalcarsi (viene mantenuto un piccolo scarto pari a `step`).
//
// È un componente "controllato": i valori arrivano da fuori (minValue/maxValue)
// e ogni trascinamento notifica il genitore tramite onChange({ min, max }).
//
// Props:
//   min          valore minimo assoluto della scala (default 0)
//   max          valore massimo assoluto della scala (default 100)
//   step         incremento di ogni maniglia (default 1)
//   minValue     prezzo minimo attualmente selezionato
//   maxValue     prezzo massimo attualmente selezionato
//   onChange     callback({ min, max }) chiamata a ogni trascinamento
//   format       funzione per formattare i valori mostrati (es. (v) => `${v} €`)
//   ariaMinLabel etichetta accessibile della maniglia minima
//   ariaMaxLabel etichetta accessibile della maniglia massima

import styles from "./PriceRangeSlider.module.css";

export function PriceRangeSlider({
  min = 0,
  max = 100,
  step = 1,
  minValue,
  maxValue,
  onChange,
  format = (v) => v,
  ariaMinLabel = "min",
  ariaMaxLabel = "max",
}) {
  // Scarto minimo fra le due maniglie: non possono sovrapporsi.
  const gap = step;

  // Maniglia SINISTRA: non può superare (maxValue - gap).
  function handleMin(e) {
    const value = Math.min(Number(e.target.value), maxValue - gap);
    onChange?.({ min: value, max: maxValue });
  }

  // Maniglia DESTRA: non può scendere sotto (minValue + gap).
  function handleMax(e) {
    const value = Math.max(Number(e.target.value), minValue + gap);
    onChange?.({ min: minValue, max: value });
  }

  // Percentuali per posizionare il tratto colorato fra le due maniglie.
  const span = max - min || 1;
  const leftPct = ((minValue - min) / span) * 100;
  const rightPct = ((maxValue - min) / span) * 100;

  return (
    <div className={styles.wrapper}>
      {/* Valori correnti (min a sinistra, max a destra) */}
      <div className={styles.values}>
        <span>{format(minValue)}</span>
        <span>{format(maxValue)}</span>
      </div>

      {/* Binario + tratto attivo + due maniglie sovrapposte */}
      <div className={styles.slider}>
        <div className={styles.track} />
        <div
          className={styles.range}
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />

        {/* Input della maniglia minima */}
        <input
          type="range"
          className={styles.thumb}
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={handleMin}
          aria-label={ariaMinLabel}
        />

        {/* Input della maniglia massima */}
        <input
          type="range"
          className={styles.thumb}
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={handleMax}
          aria-label={ariaMaxLabel}
        />
      </div>
    </div>
  );
}
