"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import styles from "../auth-card.module.css";

export default function RegistrazionePage() {
  const { t } = useTranslation();
  return (
    <div className={styles.card}>
      <p className={styles.brand}>ARCADIUM</p>
      <h1 className={styles.title}>{t("auth.register.title")}</h1>
      <p className={styles.subtitle}>{t("auth.register.subtitle")}</p>
      <p className={styles.badge}>{t("auth.register.badge")} · M5 - T5</p>
      <p className={styles.alt}>
        {t("auth.register.haveAccount")}{" "}
        <Link className={styles.link} href="/login">
          {t("auth.register.signIn")}
        </Link>
      </p>
    </div>
  );
}