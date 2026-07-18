"use client";

import { useEffect, useRef } from "react";

// useScrollRestoration
// -----------------------------------------------------------------------------
// Ripristina la posizione di scroll quando si TORNA su una pagina (es. "indietro"
// dal dettaglio di un gioco verso il Negozio).
//
// Perché serve un hook e non basta il browser: la lista del Negozio si carica in
// modo ASINCRONO (prima "caricamento…", poi i risultati). Il ripristino
// automatico dello scroll del browser scatta troppo presto, quando la pagina è
// ancora vuota e corta: non trovando l'altezza giusta, ti lascia in cima.
// Qui salviamo noi lo scroll in sessionStorage (una chiave per URL) e lo
// ripristiniamo SOLO dopo che i risultati sono comparsi (`ready`).
//
// Parametri:
//   key   -> identifica la pagina/stato (di solito pathname + query string).
//            URL diversi (filtri diversi) hanno posizioni salvate diverse.
//   ready -> true quando i dati sono caricati e la lista è nel DOM.

export function useScrollRestoration(key, ready) {
  // Evita di ripristinare più di una volta per montaggio (es. quando cambio un
  // filtro NON voglio che la pagina risalti alla vecchia posizione).
  const restoredRef = useRef(false);

  // --- Salvataggio continuo della posizione, sotto la chiave dell'URL corrente ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const save = () => {
      try {
        sessionStorage.setItem(`scroll:${key}`, String(window.scrollY));
      } catch {
        /* sessionStorage non disponibile: ignoriamo, è solo una comodità */
      }
    };

    // Salviamo durante lo scroll (limitato a un frame per non pesare) e anche
    // quando la pagina sta per essere lasciata/nascosta.
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        save();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);

    return () => {
      // Allo smontaggio (navigazione verso il dettaglio) salviamo l'ultima
      // posizione, così al ritorno sappiamo dove riportare l'utente.
      save();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", save);
    };
  }, [key]);

  // --- Ripristino: una sola volta, appena i dati sono pronti dopo il montaggio ---
  useEffect(() => {
    if (!ready || restoredRef.current) return;
    if (typeof window === "undefined") return;
    restoredRef.current = true;

    let saved;
    try {
      saved = sessionStorage.getItem(`scroll:${key}`);
    } catch {
      saved = null;
    }
    if (saved === null || saved === undefined) return;

    // Due requestAnimationFrame: aspettiamo che la griglia sia davvero
    // dipinta (quindi la pagina abbia raggiunto la sua altezza reale) prima di
    // spostare lo scroll, altrimenti il salto verrebbe "clampato" in cima.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(0, Number(saved) || 0);
      });
    });
  }, [ready, key]);
}