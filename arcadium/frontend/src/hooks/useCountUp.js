"use client";

import { useEffect, useState } from "react";

// useCountUp
// -----------------------------------------------------------------------------
// Conteggio animato: parte da 0 e sale fino a `target` con un easing morbido.
// È lo STESSO hook usato nelle pagine Statistiche e Achievement, qui estratto
// per poterlo riusare (es. nella pagina Profilo). Restituisce il valore corrente
// (numero con decimali): chi lo usa lo arrotonda/formatta come preferisce.
export function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setVal(0);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easing morbido (ease-out cubica)
      setVal(eased * target);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}