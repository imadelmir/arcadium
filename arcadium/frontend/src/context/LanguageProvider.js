"use client";

// LanguageProvider
// -----------------------------------------------------------------------------
// Applica la lingua salvata (localStorage) e la mantiene tra le visite.
// Per evitare l'errore di hydration: finché il componente non è montato sul
// client NON renderizziamo i figli. Così il primo render del client coincide
// con quello del server (entrambi "vuoti") e non c'è mai disallineamento;
// subito dopo mostriamo l'app già nella lingua corretta.

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from "@/i18n/settings";

export function LanguageProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Ripristina la lingua scelta l'ultima volta.
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && LANGUAGES.includes(saved) && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }

    // Salva i cambi futuri e tiene aggiornato <html lang="...">.
    const handleChange = (lng) => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
      document.documentElement.lang = lng;
    };
    document.documentElement.lang = i18n.language;
    i18n.on("languageChanged", handleChange);

    setMounted(true);
    return () => i18n.off("languageChanged", handleChange);
  }, []);

  // Prima del mount non disegniamo nulla: niente testo diverso tra server e
  // client, quindi l'hydration non fallisce mai.
  if (!mounted) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}