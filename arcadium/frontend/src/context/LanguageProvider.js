"use client";

// LanguageProvider
// -----------------------------------------------------------------------------
// Applica la lingua salvata (localStorage) e la mantiene tra le visite.
// Per evitare l'errore di hydration: finché il componente non è montato sul
// client NON renderizziamo i figli. Così il primo render del client coincide
// con quello del server (entrambi "vuoti") e non c'è mai disallineamento;
// subito dopo mostriamo l'app già nella lingua corretta.

import { useEffect, useSyncExternalStore } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LANGUAGE_STORAGE_KEY } from "@/i18n/settings";

// M6-T4 — "siamo sul client?" senza setState dentro l'effetto.
// Il gate anti-hydration richiede di sapere se stiamo renderizzando sul server o
// sul client. Farlo con useState(false) + setMounted(true) nell'effetto significa
// un render sprecato ed e' esattamente il pattern che react-hooks/set-state-in-effect
// segnala. useSyncExternalStore lo esprime senza stato: React usa lo snapshot del
// server (false) per l'HTML e quello del client (true) subito dopo l'hydration.
// Lo store non emette mai eventi: il valore non cambia piu' dopo il mount.
const subscribeNoop = () => () => {};
const snapshotClient = () => true;
const snapshotServer = () => false;

export function LanguageProvider({ children }) {
  const mounted = useSyncExternalStore(subscribeNoop, snapshotClient, snapshotServer);

  useEffect(() => {
    // Il ripristino della lingua salvata avviene all'init di i18n (vedi i18n/index.js):
    // qui restano solo la persistenza dei cambi futuri e l'attributo <html lang="...">.
    const handleChange = (lng) => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
      document.documentElement.lang = lng;
    };
    document.documentElement.lang = i18n.language;
    i18n.on("languageChanged", handleChange);

    return () => i18n.off("languageChanged", handleChange);
  }, []);

  // Prima del mount non disegniamo nulla: niente testo diverso tra server e
  // client, quindi l'hydration non fallisce mai.
  if (!mounted) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}