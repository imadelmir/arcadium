"use client";

// LanguageSwitcher
// -----------------------------------------------------------------------------
// The IT / EN toggle. Clicking a code switches the whole app's language; the
// choice is remembered by the LanguageProvider. Lives in the top bar.
// The active language is highlighted by a single glass indicator that slides
// between the options (same water-glass style as the sidebar active item).

import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n/settings";
import styles from "./LanguageSwitcher.module.css";

export function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();

  const activeIndex = Math.max(0, LANGUAGES.indexOf(i18n.language));

  return (
    <div
      className={[styles.switcher, className].filter(Boolean).join(" ")}
      role="group"
      aria-label={t("language.label")}
    >
      <span
        className={styles.thumb}
        style={{ "--active-index": activeIndex }}
        aria-hidden="true"
      />
      {LANGUAGES.map((lng) => {
        const isActive = i18n.language === lng;
        return (
          <button
            key={lng}
            type="button"
            className={styles.option}
            data-active={isActive}
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