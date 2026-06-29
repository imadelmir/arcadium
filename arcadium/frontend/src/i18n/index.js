// The single i18next instance, configured once for the whole app.
// It is created with the default language so the server and the first client
// render always match (no hydration mismatch). The saved preference is applied
// right after mount by the LanguageProvider.

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import it from "./locales/it.json";
import en from "./locales/en.json";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./settings";

// Only initialise once (modules are cached, but this is an extra safety net).
if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: {
      it: { translation: it },
      en: { translation: en },
    },
    lng: DEFAULT_LANGUAGE,
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
