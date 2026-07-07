"use client";

// Campanella notifiche nell'header. Stesso stile "glass" dei pulsanti
// Discord/Twitch (M5-T6), con tinta ambra passata via --brand-rgb.

import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import styles from "./NotificationButton.module.css";

export function NotificationButton({ onClick }) {
  const { t } = useTranslation();
  const label = t("notifications.label");

  return (
    <button
      type="button"
      className={styles.button}
      style={{ "--brand-rgb": "245, 177, 76" }}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Bell size={22} className={styles.icon} aria-hidden="true" />
    </button>
  );
}