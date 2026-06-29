"use client";

import { useTranslation } from "react-i18next";
import styles from "../placeholder.module.css";

export default function BacklogPage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t("pages.backlog.title")}</h1>
      <p className={styles.subtitle}>{t("pages.backlog.subtitle")}</p>
      <p className={styles.badge}>{t("common.underConstruction")} · M5 - T11</p>
    </section>
  );
}