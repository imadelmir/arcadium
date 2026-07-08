"use client";

// Pagina "Wishlist" (M5-T10).
// Elenco dei giochi desiderati in righe: banner calo prezzo, ordinamento,
// prezzo/sconto, toggle notifica e rimozione. In attesa del backend lavora sul
// dataset finto (M4-T7): l'aggancio all'API sarà la sola sostituzione dati.

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Bell, BellOff, X, TrendingDown } from "lucide-react";

import { GameImage, Select } from "@/components";
import { discountedPrice, formatPrice } from "@/utils/price";
import { getWishlist } from "./mockWishlist";
import styles from "./wishlist.module.css";

// Prezzo finale in centesimi (0 se gratis, applica lo sconto se presente).
function finalCents(game) {
  if (game.priceCents === 0) return 0;
  return game.discount > 0
    ? discountedPrice(game.priceCents, game.discount)
    : game.priceCents;
}

export default function WishlistPage() {
  const { t } = useTranslation();

  const [games, setGames] = useState(() => getWishlist());
  const [sort, setSort] = useState("priceAsc");

  // Primo gioco con calo recente: alimenta il banner in alto.
  const dropped = games.find((game) => game.recentlyDropped);

  // Lista ordinata secondo il criterio scelto.
  const sorted = useMemo(() => {
    const list = [...games];
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "discount") list.sort((a, b) => b.discount - a.discount);
    else list.sort((a, b) => finalCents(a) - finalCents(b)); // priceAsc
    return list;
  }, [games, sort]);

  // Rimuove un gioco dalla wishlist (in memoria; domani sarà una DELETE all'API).
  function removeGame(appId) {
    setGames((prev) => prev.filter((game) => game.appId !== appId));
  }

  // Attiva/disattiva la notifica calo prezzo di un gioco.
  function toggleAlert(appId) {
    setGames((prev) =>
      prev.map((game) =>
        game.appId === appId
          ? { ...game, priceAlert: !game.priceAlert }
          : game
      )
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t("nav.wishlist")}</h1>

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
      </header>

      {/* Banner: un gioco della wishlist è sceso di prezzo */}
      {dropped && (
        <div className={styles.banner}>
          <span className={styles.bannerIcon} aria-hidden="true">
            <TrendingDown size={18} />
          </span>
          <p className={styles.bannerText}>
            {t("wishlist.priceDrop", { name: dropped.name })}
          </p>
          <span className={styles.bannerPrice}>
            <s>{formatPrice(dropped.priceCents)}</s>
            <strong>{formatPrice(finalCents(dropped))}</strong>
          </span>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t("wishlist.empty.title")}</p>
          <p className={styles.emptyText}>{t("wishlist.empty.text")}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {sorted.map((game) => {
            const isFree = game.priceCents === 0;
            const hasDiscount = !isFree && game.discount > 0;

            return (
              <li key={game.appId} className={styles.row}>
                {/* Copertina + testo: portano al dettaglio gioco (T9) */}
                <Link href={`/gioco/${game.appId}`} className={styles.info}>
                  <span className={styles.cover}>
                    <GameImage src={game.headerImage} alt={game.name} />
                  </span>
                  <span className={styles.texts}>
                    <span className={styles.name}>{game.name}</span>
                    <span className={styles.tags}>{game.tags.join(" · ")}</span>
                  </span>
                </Link>

                <div className={styles.right}>
                  {/* Blocco prezzo: gratis / scontato / pieno con notifica */}
                  <div className={styles.price}>
                    <span className={styles.priceMain}>
                      {isFree ? (
                        <span className={styles.free}>{t("wishlist.free")}</span>
                      ) : hasDiscount ? (
                        <>
                          <span className={styles.discount}>-{game.discount}%</span>
                          <s className={styles.old}>{formatPrice(game.priceCents)}</s>
                          <strong className={styles.now}>
                            {formatPrice(finalCents(game))}
                          </strong>
                        </>
                      ) : (
                        <strong className={styles.now}>
                          {formatPrice(game.priceCents)}
                        </strong>
                      )}
                    </span>

                    {!isFree && !hasDiscount && game.priceAlert && (
                      <span className={styles.alertText}>
                        {t("wishlist.alertOn")}
                      </span>
                    )}
                  </div>

                  {/* Azioni: notifica prezzo e rimozione */}
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      data-active={game.priceAlert}
                      onClick={() => toggleAlert(game.appId)}
                      aria-label={
                        game.priceAlert
                          ? t("wishlist.alertOn")
                          : t("wishlist.alertOff")
                      }
                    >
                      {game.priceAlert ? <Bell size={16} /> : <BellOff size={16} />}
                    </button>
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

      <p className={styles.footer}>
        <Bell size={14} aria-hidden="true" />
        {t("wishlist.footer")}
      </p>
    </section>
  );
}