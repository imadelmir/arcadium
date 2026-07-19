"use client";

// =============================================================================
// ScreenshotLightbox — visualizzatore a schermo intero per gli screenshot del
// dettaglio gioco (M5-T9).
// -----------------------------------------------------------------------------
// Si apre cliccando una miniatura in .media: mostra l'immagine ingrandita su
// sfondo scuro, con frecce per scorrere avanti/indietro tra tutti gli
// screenshot del gioco, contatore (es. "2 di 6"), chiusura con Esc, clic sullo
// sfondo o pulsante X. Solo tastiera e mouse: nessuna libreria aggiunta.
//
// Props:
//   - images: string[]     tutti gli URL degli screenshot (game.screenshots)
//   - index: number        indice attualmente aperto
//   - onClose(): void
//   - onIndexChange(nextIndex): void
// =============================================================================

import { useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./ScreenshotLightbox.module.css";

export function ScreenshotLightbox({ images, index, onClose, onIndexChange }) {
  const { t } = useTranslation();
  const total = images.length;

  // Indietro/avanti con "giro" circolare: dall'ultima si torna alla prima e
  // viceversa, così le frecce funzionano sempre senza doversi disabilitare.
  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + total) % total);
  }, [index, total, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % total);
  }, [index, total, onIndexChange]);

  // Tastiera: Esc chiude, le frecce scorrono. Un solo listener finché il
  // lightbox è aperto (si registra/rimuove con il montaggio del componente).
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, goPrev, goNext]);

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("gameDetail.lightbox.title")}
    >
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label={t("common.close")}
      >
        <X size={22} />
      </button>

      {total > 1 && (
        <button
          type="button"
          className={`${styles.nav} ${styles.navPrev}`}
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label={t("gameDetail.lightbox.previous")}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Ferma la propagazione: cliccare l'immagine non deve chiudere il
          lightbox (solo il clic sullo sfondo o sul pulsante X lo chiude). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={t("gameDetail.lightbox.imageAlt", { current: index + 1, total })}
        className={styles.image}
        onClick={(e) => e.stopPropagation()}
      />

      {total > 1 && (
        <button
          type="button"
          className={`${styles.nav} ${styles.navNext}`}
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label={t("gameDetail.lightbox.next")}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {total > 1 && (
        <span className={styles.counter} onClick={(e) => e.stopPropagation()}>
          {index + 1} / {total}
        </span>
      )}
    </div>
  );
}