"use client";

import { useTranslation } from "react-i18next";
import styles from "../placeholder.module.css";

export default function LibreriaPage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t("pages.libreria.title")}</h1>
      <p className={styles.subtitle}>{t("pages.libreria.subtitle")}</p>
      <p className={styles.badge}>{t("common.underConstruction")} · M5 - T10</p>
    </section>
  );
}