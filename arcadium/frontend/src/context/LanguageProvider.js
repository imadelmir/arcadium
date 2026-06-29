"use client";

// LanguageProvider
// -----------------------------------------------------------------------------
// Wraps the whole app so every component can translate text with the
// useTranslation() hook. It also:
//   - restores the language the user picked last time (from localStorage),
//   - saves the choice whenever it changes,
//   - keeps the <html lang="..."> attribute in sync (good for accessibility/SEO).
//
// It is added once in the root layout, around {children}.

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from "@/i18n/settings";

export function LanguageProvider({ children }) {
  useEffect(() => {
    // Apply the saved preference after mount (so it never clashes with the
    // server-rendered default language).
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && LANGUAGES.includes(saved) && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }

    // Persist future changes and keep <html lang> up to date.
    const handleChange = (lng) => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
      document.documentElement.lang = lng;
    };
    document.documentElement.lang = i18n.language;
    i18n.on("languageChanged", handleChange);

    return () => {
      i18n.off("languageChanged", handleChange);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
