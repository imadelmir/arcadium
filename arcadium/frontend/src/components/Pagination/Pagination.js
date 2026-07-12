"use client";

// Pagination — barra di paginazione per liste lunghe (change request Negozio).
// -----------------------------------------------------------------------------
// Mostra "Pagina 1", "Pagina 2", ... con i pulsanti Precedente / Successiva.
// Lo stato delle pagine è 0-based (come il backend Spring Data: page/size),
// ma all'utente i numeri sono mostrati 1-based. Per non allungare troppo la
// barra con centinaia di pagine, si mostra una finestra di massimo 5 numeri
// centrata sulla pagina corrente, con la prima/ultima pagina e i puntini "…".
//
// Props:
//   page        pagina corrente (0-based)
//   totalPages  numero totale di pagine (da PageResponse.totalPages)
//   onChange    callback(nuovaPagina0Based) al cambio pagina
//   labels      { previous, next, page } etichette localizzate

import { ChevronLeft, ChevronRight } from "lucide-react";

import styles from "./Pagination.module.css";

export function Pagination({ page, totalPages, onChange, labels }) {
  // Con 0 o 1 pagina la barra non serve.
  if (!totalPages || totalPages <= 1) return null;

  // Finestra di al massimo 5 numeri centrata sulla pagina corrente.
  const windowSize = 5;
  let start = Math.max(0, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize);
  start = Math.max(0, end - windowSize);

  const numbers = [];
  for (let i = start; i < end; i++) numbers.push(i);

  // Cambia pagina solo se il valore è valido e diverso da quello attuale.
  const go = (p) => {
    if (p < 0 || p >= totalPages || p === page) return;
    onChange?.(p);
  };

  return (
    <nav className={styles.pagination} aria-label="pagination">
      {/* Precedente */}
      <button
        type="button"
        className={styles.nav}
        onClick={() => go(page - 1)}
        disabled={page === 0}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        <span>{labels.previous}</span>
      </button>

      <ul className={styles.pages}>
        {/* Prima pagina + puntini, se la finestra non parte da 0 */}
        {start > 0 && (
          <li>
            <button type="button" className={styles.page} onClick={() => go(0)}>
              {`${labels.page} 1`}
            </button>
          </li>
        )}
        {start > 0 && <li className={styles.ellipsis} aria-hidden="true">…</li>}

        {/* Finestra centrale di numeri */}
        {numbers.map((n) => (
          <li key={n}>
            <button
              type="button"
              className={styles.page}
              data-current={n === page}
              aria-current={n === page ? "page" : undefined}
              onClick={() => go(n)}
            >
              {`${labels.page} ${n + 1}`}
            </button>
          </li>
        ))}

        {/* Puntini + ultima pagina, se la finestra non arriva alla fine */}
        {end < totalPages && <li className={styles.ellipsis} aria-hidden="true">…</li>}
        {end < totalPages && (
          <li>
            <button
              type="button"
              className={styles.page}
              onClick={() => go(totalPages - 1)}
            >
              {`${labels.page} ${totalPages}`}
            </button>
          </li>
        )}
      </ul>

      {/* Successiva */}
      <button
        type="button"
        className={styles.nav}
        onClick={() => go(page + 1)}
        disabled={page >= totalPages - 1}
      >
        <span>{labels.next}</span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
