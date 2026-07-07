import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

import { GameImage } from "@/components/GameImage/GameImage";
import { Button } from "@/components/Button/Button";
import { formatPrice, discountedPrice } from "@/utils/price";
import styles from "./StoreCard.module.css";

// StoreCard
// -----------------------------------------------------------------------------
// Singola card di un gioco nel catalogo del negozio (M5 - T8). Mostra la
// copertina con il numero di recensioni (in alto a sinistra) e l'eventuale
// badge sconto (in alto a destra), il titolo, fino a tre chip di genere, il
// blocco prezzo (prezzo pieno barrato + prezzo finale, oppure "Gratis") e la
// CTA principale che apre il gioco su Steam.
//
//   <StoreCard game={game} />
//
// Forma di `game` (vedi negozio/mockGames.js, sostituito poi dall'API):
//   { appId, name, genres, priceCents, discount, reviews, ... }

// Abbrevia i numeri grandi: 720000 -> "720K", 1500000 -> "1.5M".
function formatCount(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

// Logo di Steam per la CTA (lucide non ha l'icona di Steam).
function SteamIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.7 2 2.4 6 2 11.1l5.4 2.2a2.9 2.9 0 0 1 1.7-.5l2.4-3.5v-.1a3.8 3.8 0 1 1 3.8 3.8h-.1l-3.4 2.5a2.9 2.9 0 0 1-5.7.7L2 15a10 10 0 1 0 10-13Zm-3.3 15.2 -1.2-.5a2.2 2.2 0 0 0 3.9-.6 2.2 2.2 0 0 0-3-2.7l1.2.5a1.6 1.6 0 1 1-1 3Zm8.6-8.9a2.5 2.5 0 1 0-2.5 2.5 2.5 2.5 0 0 0 2.5-2.5Zm-4.4 0a1.9 1.9 0 1 1 1.9 1.9 1.9 1.9 0 0 1-1.9-1.9Z" />
    </svg>
  );
}

export function StoreCard({ game, className = "", ...rest }) {
  const { t } = useTranslation();

  // Estraggo i campi dal gioco, con valori di default per sicurezza.
  const { appId, name, genres = [], priceCents = 0, discount = 0, reviews = 0, steamUrl } = game;

  const isFree = priceCents === 0;                          // gioco gratuito?
  const finalCents = discountedPrice(priceCents, discount); // prezzo dopo sconto

  // Copertina presa dalla CDN di Steam a partire dall'appId; link al gioco.
  const cover = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
  const href = steamUrl ?? `https://store.steampowered.com/app/${appId}`;

  const classes = [styles.card, className].filter(Boolean).join(" ");

  // Apre la pagina del gioco su Steam in una nuova scheda (in sicurezza).
  const openOnSteam = () => window.open(href, "_blank", "noopener,noreferrer");

  return (
    <article className={classes} {...rest}>
      {/* Copertina con badge recensioni (sx, glass) e sconto (dx) */}
      <div className={styles.cover}>
        <GameImage src={cover} alt={name} />

        {reviews > 0 && (
          <span className={styles.reviews}>
            <Star size={12} className={styles.reviewsIcon} aria-hidden="true" />
            {formatCount(reviews)}
          </span>
        )}

        {discount > 0 && <span className={styles.discount}>-{discount}%</span>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title} title={name}>
          {name}
        </h3>

        {/* Chip dei generi: ne mostro al massimo tre */}
        {genres.length > 0 && (
          <ul className={styles.genres}>
            {genres.slice(0, 3).map((genre) => (
              <li key={genre} className={styles.genre}>
                {genre}
              </li>
            ))}
          </ul>
        )}

        {/* Prezzo + pulsante d'acquisto */}
        <div className={styles.footer}>
          <div className={styles.price}>
            {isFree ? (
              <span className={styles.free}>{t("store.free")}</span>
            ) : (
              <>
                {/* Prezzo pieno barrato solo se c'è uno sconto */}
                {discount > 0 && (
                  <span className={styles.priceOld}>{formatPrice(priceCents)}</span>
                )}
                <span className={styles.priceNow}>{formatPrice(finalCents)}</span>
              </>
            )}
          </div>

          <Button
            size="sm"
            fullWidth
            iconLeft={<SteamIcon size={16} />}
            onClick={openOnSteam}
            aria-label={`${isFree ? t("store.getOnSteam") : t("store.buyOnSteam")} — ${name}`}
          >
            {isFree ? t("store.getOnSteam") : t("store.buyOnSteam")}
          </Button>
        </div>
      </div>
    </article>
  );
}