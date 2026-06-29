"use client";

import { useTranslation } from "react-i18next";
import styles from "../placeholder.module.css";

export default function ImpostazioniPage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t("pages.impostazioni.title")}</h1>
      <p className={styles.subtitle}>{t("pages.impostazioni.subtitle")}</p>
      <p className={styles.badge}>{t("common.underConstruction")} · M5 - T15</p>
    </section>
  );
}