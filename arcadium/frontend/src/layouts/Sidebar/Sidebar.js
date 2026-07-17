'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo/Logo';
import { navLinks } from '@/config/nav';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  // M6-T5: indice della voce sotto il mouse (null = mouse fuori dal menu).
  const [hoverIndex, setHoverIndex] = useState(null);

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');
  const activeIndex = navLinks.findIndex((item) => isActive(item.href));

  // M6-T5: la pill segue il mouse. Quando il mouse esce dal menu torna sulla
  // voce attiva. La transizione CSS della pill fa il resto: nessuna animazione
  // in JS, si sposta soltanto la variabile --active-index.
  const pillIndex = hoverIndex ?? activeIndex;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Logo />
      </div>

      {/* onMouseLeave sta sul <nav> e non sulle singole voci: passando da una
          voce all'altra la pill non torna mai indietro a metà strada. */}
      <nav className={styles.nav} onMouseLeave={() => setHoverIndex(null)}>
        <span
          className={styles.pill}
          style={{ '--active-index': pillIndex }}
          /* La pill sparisce solo se non c'è né una voce attiva né il mouse
             sopra (es. su una rotta che non sta nel menu). */
          data-hidden={pillIndex < 0}
          aria-hidden="true"
        />

        {navLinks.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navItem}
              data-active={isActive(item.href)}
              onMouseEnter={() => setHoverIndex(index)}
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