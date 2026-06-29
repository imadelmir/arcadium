"use client";

// LanguageSwitcher
// -----------------------------------------------------------------------------
// The IT / EN toggle. Clicking a code switches the whole app's language; the
// choice is remembered by the LanguageProvider. Lives in the top bar.

import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n/settings";
import styles from "./LanguageSwitcher.module.css";

export function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();

  return (
    <div
      className={[styles.switcher, className].filter(Boolean).join(" ")}
      role="group"
      aria-label={t("language.label")}
    >
      {LANGUAGES.map((lng) => {
        const isActive = i18n.language === lng;
        return (
          <button
            key={lng}
            type="button"
            className={[styles.option, isActive ? styles.active : ""].filter(Boolean).join(" ")}
            aria-pressed={isActive}
            onClick={() => i18n.changeLanguage(lng)}
          >
            {lng.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
