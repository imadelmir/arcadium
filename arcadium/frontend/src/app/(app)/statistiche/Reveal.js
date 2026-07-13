"use client";

// Reveal.js
// -----------------------------------------------------------------------------
// Mostra il contenuto — e ne avvia l'animazione — solo quando l'elemento entra
// nella viewport mentre l'utente scorre. Usa IntersectionObserver.
//
// Perché serve: Recharts esegue la sua animazione di disegno al MONTAGGIO. Se il
// grafico è sotto la piega, al caricamento pagina si anima fuori schermo e,
// quando ci arrivi scorrendo, è già fermo. Montandolo proprio quando arriva in
// vista, l'animazione parte davanti ai tuoi occhi.
//
//   <Reveal minHeight={240}><GenreDonut data={...} /></Reveal>
//
// minHeight: altezza (px) da riservare prima della comparsa, così il layout
//            non "salta" quando il grafico appare. Passa l'altezza del grafico.

import { useEffect, useRef, useState } from "react";
import styles from "./Reveal.module.css";

export function Reveal({ children, minHeight }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Se il browser non supporta IntersectionObserver, mostra subito.
    // M6-T4: fuori dal corpo sincrono dell'effetto (setState sincrono li' dentro
    // costa un render in piu' ed e' segnalato da react-hooks/set-state-in-effect).
    // E' un ramo di fallback per browser molto vecchi: il tick di ritardo e' invisibile.
    if (typeof IntersectionObserver === "undefined") {
      const id = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // si attiva una volta sola
        }
      },
      // scatta quando circa il 25% dell'elemento è visibile
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${visible ? styles.visible : ""}`}
      // riserviamo l'altezza del grafico finché non compare (niente salti)
      style={{ minHeight }}
    >
      {visible ? children : null}
    </div>
  );
}