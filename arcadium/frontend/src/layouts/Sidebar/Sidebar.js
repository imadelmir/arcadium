'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo/Logo';  // ← usa la TUA riga originale se era diversa
import { navLinks } from '@/config/nav';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');
  const activeIndex = navLinks.findIndex((item) => isActive(item.href));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Logo />
      </div>

      <nav className={styles.nav}>
        <span
          className={styles.pill}
          style={{ '--active-index': activeIndex }}
          data-hidden={activeIndex < 0}
          aria-hidden="true"
        />

        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navItem}
              data-active={isActive(item.href)}
            >
              <Icon className={styles.icon} aria-hidden="true" />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}