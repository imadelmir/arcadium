"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import styles from "./not-found.module.css";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <main className={styles.wrap}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>{t("notFound.title")}</h1>
      <p className={styles.text}>{t("notFound.text")}</p>
      <Link className={styles.link} href="/panoramica">
        {t("notFound.back")}
      </Link>
    </main>
  );
}