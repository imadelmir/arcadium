"use client";

// Pagina "Wishlist" (M5-T10) — COLLEGATA al backend (M5-T13).
// Legge i giochi da GET /api/wishlist e permette di rimuoverli davvero
// (DELETE /api/wishlist/{appId}). Il backend non gestisce notifiche di calo
// prezzo, quindi banner e campanello non sono più presenti.

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { X } from "lucide-react";

import { GameImage, Select, Spinner } from "@/components";
import { formatPrice } from "@/lib/format";
import { listWishlist, removeFromWishlist } from "@/lib/api/wishlist";
import styles from "./wishlist.module.css";

export default function WishlistPage() {
  const { t, i18n } = useTranslation();

  // Elenco (ogni voce: { game, addedAt }), stati di caricamento e ordinamento.
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState("priceAsc");

  // Carica la wishlist dal backend all'apertura.
  useEffect(() => {
    let attivo = true;
    // M6-T4: niente setState sincrono qui dentro. `loading` parte gia' a true
    // dalla useState e l'effetto gira una volta sola (deps []): il vecchio
    // setLoading(true)/setError(false) provocava solo un render in piu'.
    listWishlist()
      .then((list) => attivo && setItems(list))
      .catch(() => attivo && setError(true))
      .finally(() => attivo && setLoading(false));
    return () => { attivo = false; };
  }, []);

  // Prezzo finale in euro (per l'ordinamento). price è in centesimi.
  const finalEuro = (game) => formatPrice(game.price, game.discount).finalValue;

  // Lista ordinata secondo il criterio scelto.
  const sorted = useMemo(() => {
    const list = [...items];
    if (sort === "name") list.sort((a, b) => a.game.name.localeCompare(b.game.name));
    else if (sort === "discount") list.sort((a, b) => (b.game.discount ?? 0) - (a.game.discount ?? 0));
    else list.sort((a, b) => finalEuro(a.game) - finalEuro(b.game)); // priceAsc
    return list;
  }, [items, sort]);

  // Rimozione reale: chiama il backend e toglie la riga dalla lista.
  async function removeGame(appId) {
    // ottimistico: tolgo subito dalla UI
    const backup = items;
    setItems((prev) => prev.filter((it) => it.game.appId !== appId));
    try {
      await removeFromWishlist(appId);
    } catch {
      setItems(backup); // se fallisce, ripristino
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t("nav.wishlist")}</h1>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.sort}>
          <Select
            label={t("wishlist.sortLabel")}
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="priceAsc">{t("wishlist.sort.priceAsc")}</option>
            <option value="discount">{t("wishlist.sort.discount")}</option>
            <option value="name">{t("wishlist.sort.name")}</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className={styles.empty}><Spinner size="lg" /></div>
      ) : error ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>{t("errors.network")}</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t("wishlist.empty.title")}</p>
          <p className={styles.emptyText}>{t("wishlist.empty.text")}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {sorted.map(({ game }) => {
            const p = formatPrice(game.price, game.discount, i18n.language);

            return (
              <li key={game.appId} className={styles.row}>
                {/* Copertina + nome: portano al dettaglio gioco */}
                <Link href={`/gioco/${game.appId}`} className={styles.info}>
                  <span className={styles.cover}>
                    <GameImage src={game.headerImage} alt={game.name} />
                  </span>
                  <span className={styles.texts}>
                    <span className={styles.name}>{game.name}</span>
                  </span>
                </Link>

                <div className={styles.right}>
                  {/* Prezzo: gratis / scontato / pieno */}
                  <div className={styles.price}>
                    <span className={styles.priceMain}>
                      {p.isFree ? (
                        <span className={styles.free}>{t("wishlist.free")}</span>
                      ) : p.hasDiscount ? (
                        <>
                          <span className={styles.discount}>-{p.discount}%</span>
                          <s className={styles.old}>{p.original}</s>
                          <strong className={styles.now}>{p.final}</strong>
                        </>
                      ) : (
                        <strong className={styles.now}>{p.original}</strong>
                      )}
                    </span>
                  </div>

                  {/* Azione: rimozione reale dalla wishlist */}
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => removeGame(game.appId)}
                      aria-label={t("wishlist.remove")}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}