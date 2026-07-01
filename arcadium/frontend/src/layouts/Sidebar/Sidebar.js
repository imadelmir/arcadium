"use client";

// The left sidebar: brand on top, navigation links below.
// The links come from one config file (navLinks), so this just maps over them.

import { Logo, NavItem } from "@/components";
import { navLinks } from "@/config/nav";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <Logo />
      </div>

      <nav className={styles.nav}>
        {navLinks.map((link) => (
          <NavItem
            key={link.href}
            href={link.href}
            labelKey={link.labelKey}
            icon={link.icon}
          />
        ))}
      </nav>
    </aside>
  );
}