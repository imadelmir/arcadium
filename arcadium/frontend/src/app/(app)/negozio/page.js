"use client";

import { useTranslation } from "react-i18next";
import styles from "../placeholder.module.css";

export default function NegozioPage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t("pages.negozio.title")}</h1>
      <p className={styles.subtitle}>{t("pages.negozio.subtitle")}</p>
      <p className={styles.badge}>{t("common.underConstruction")} · M5 - T8</p>
    </section>
  );
}