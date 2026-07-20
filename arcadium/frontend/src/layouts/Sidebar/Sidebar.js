'use client';

// =============================================================================
// Sidebar — navigazione principale dell'app.
//
// Change request notifiche: le voci possono portare un pallino numerato. Il
// numero non e' caricato qui ma letto da NotificationsProvider tramite la chiave
// dichiarata in config/nav.js (`badge`), cosi' la sidebar resta un componente di
// sola presentazione e il contatore puo' essere aggiornato anche da altrove
// (es. la pagina Community dopo aver accettato una richiesta).
//
// Change request responsive: la sidebar ha tre rese, decise dai media query del
// foglio di stile (vedi Sidebar.module.css). La prop `open` conta SOLO sotto i
// 768px, dove la sidebar e' un pannello a scomparsa; sulle misure maggiori e'
// sempre a schermo e il valore viene ignorato dal CSS.
// =============================================================================

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo/Logo';
import { useNotifications } from '@/context/NotificationsProvider';
import { navLinks } from '@/config/nav';
import styles from './Sidebar.module.css';

// Oltre questa soglia il pallino mostra "9+" invece del numero esatto: a tre
// cifre il cerchio si deformerebbe e il numero preciso non aggiunge nulla.
const MAX_BADGE = 9;

export function Sidebar({ open = false }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { friendRequests } = useNotifications();

  // M6-T5: indice della voce sotto il mouse (null = mouse fuori dal menu).
  const [hoverIndex, setHoverIndex] = useState(null);

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');
  const activeIndex = navLinks.findIndex((item) => isActive(item.href));

  // M6-T5: la pill segue il mouse. Quando il mouse esce dal menu torna sulla
  // voce attiva. La transizione CSS della pill fa il resto: nessuna animazione
  // in JS, si sposta soltanto la variabile --active-index.
  const pillIndex = hoverIndex ?? activeIndex;

  // Contatori disponibili, indicizzati per la chiave usata in config/nav.js.
  const contatori = { friendRequests };

  return (
    <aside className={styles.sidebar} data-open={open}>
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
          const etichetta = t(item.labelKey);
          const conteggio = item.badge ? contatori[item.badge] ?? 0 : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navItem}
              data-active={isActive(item.href)}
              /* Con la sidebar a sole icone (tablet) l'etichetta non si vede:
                 il title la restituisce al passaggio del mouse. */
              title={etichetta}
              onMouseEnter={() => setHoverIndex(index)}
            >
              {/* Il pallino e' ancorato all'ICONA e non alla voce: cosi' resta
                  al posto giusto anche quando l'etichetta sparisce. */}
              <span className={styles.iconWrap}>
                <Icon className={styles.icon} aria-hidden="true" />
                {conteggio > 0 && (
                  <span className={styles.badge} aria-hidden="true">
                    {conteggio > MAX_BADGE ? `${MAX_BADGE}+` : conteggio}
                  </span>
                )}
              </span>

              <span className={styles.label}>{etichetta}</span>

              {/* Il numero va anche detto, non solo mostrato: il pallino sopra e'
                  aria-hidden e da solo non direbbe nulla a un lettore di schermo. */}
              {conteggio > 0 && (
                <span className={styles.srOnly}>
                  {t('nav.pendingRequests', { count: conteggio })}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
