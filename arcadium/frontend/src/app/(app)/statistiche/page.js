"use client";

import { useTranslation } from "react-i18next";
import styles from "../placeholder.module.css";

export default function StatistichePage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t("pages.statistiche.title")}</h1>
      <p className={styles.subtitle}>{t("pages.statistiche.subtitle")}</p>
      <p className={styles.badge}>{t("common.underConstruction")} · M5 - T12</p>
    </section>
  );
}