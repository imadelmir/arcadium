"use client";

import { useTranslation } from "react-i18next";
import { Search, ChevronDown } from "lucide-react";
import { LanguageSwitcher, Avatar, SocialLinks, NotificationButton } from "@/components";
import styles from "./Header.module.css";

export function Header() {
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <div className={styles.searchBox}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder={t("common.search")}
          aria-label={t("common.search")}
        />
      </div>

     <div className={styles.actions}>
  <div className={styles.iconCluster}>
    <SocialLinks />
    <NotificationButton />
  </div>
  <LanguageSwitcher />
  <button type="button" className={styles.user}>
    <Avatar name="Luca" size="md" />
    <span className={styles.userName}>Luca</span>
    <ChevronDown size={16} className={styles.chevron} />
  </button>
</div>
    </header>
  );
}