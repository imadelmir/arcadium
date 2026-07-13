// The single i18next instance, configured once for the whole app.
//
// M6-T4: la lingua salvata viene applicata QUI, al momento dell'inizializzazione
// lato client, non piu' dentro un effetto del LanguageProvider. Sul server non
// esiste localStorage, quindi l'istanza parte sempre dalla lingua di default e
// l'HTML del server e' identico al primo render del client (il LanguageProvider
// tiene comunque il gate anti-hydration). Applicarla qui evita il lampo di
// italiano che vedrebbe, per un istante, chi ha scelto l'inglese.

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import it from "./locales/it.json";
import en from "./locales/en.json";
import { DEFAULT_LANGUAGE, LANGUAGES, LANGUAGE_STORAGE_KEY } from "./settings";

// Lingua salvata dall'utente (solo sul browser; sul server -> default).
function linguaIniziale() {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved && LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE; // localStorage negato (modalita' privata, policy)
  }
}

// Only initialise once (modules are cached, but this is an extra safety net).
if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: {
      it: { translation: it },
      en: { translation: en },
    },
    lng: linguaIniziale(),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGES,
    interpolation: {
      escapeValue: false, // React already protects against XSS
    },
    react: {
      useSuspense: false, // simpler behaviour in the App Router
    },
  });
}

export default i18next;
