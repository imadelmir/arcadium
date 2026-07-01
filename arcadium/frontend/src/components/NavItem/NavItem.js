
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import styles from "./NavItem.module.css";

export function NavItem({ href, labelKey, icon: Icon }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isActive =
    href === "/panoramica" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`${styles.item} ${isActive ? styles.active : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon size={18} className={styles.icon} />
      <span>{t(labelKey)}</span>
    </Link>
  );
}
