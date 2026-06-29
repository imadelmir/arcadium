"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import styles from "../auth-card.module.css";

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <div className={styles.card}>
      <p className={styles.brand}>ARCADIUM</p>
      <h1 className={styles.title}>{t("auth.login.title")}</h1>
      <p className={styles.subtitle}>{t("auth.login.subtitle")}</p>
      <p className={styles.badge}>{t("auth.login.badge")} · M5 - T5</p>
      <p className={styles.alt}>
        {t("auth.login.noAccount")}{" "}
        <Link className={styles.link} href="/registrazione">
          {t("auth.login.signUp")}
        </Link>
      </p>
    </div>
  );
}