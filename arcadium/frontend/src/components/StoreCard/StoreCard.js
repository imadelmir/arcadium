import { useTranslation } from "react-i18next";
import Link from "next/link";

import { GameImage } from "@/components/GameImage/GameImage";
import { Button } from "@/components/Button/Button";
import { formatPrice } from "@/lib/format";
import styles from "./StoreCard.module.css";

// StoreCard — card di un gioco nel negozio (M5 - T8), COLLEGATA al backend (M5-T13).
// -----------------------------------------------------------------------------
// Ora riceve i campi reali di GameSummaryResponse:
//   { appId, name, headerImage, price, discount, windows, mac, linux }
// Il prezzo dal backend è in EURO (es. 19.99), 0 = gratis. La copertina è
// headerImage (URL del DB). Recensioni/valutazione/generi non esistono nel
// backend, quindi non sono più mostrati.

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

  // Campi reali dal backend, con default di sicurezza.
  const { appId, name, headerImage, price = 0, discount = 0 } = game;

  // formatPrice (da lib/format) calcola gratis/sconto e formatta in euro.
  const p = formatPrice(price, discount);

  // Link alla pagina Steam del gioco (la card intera porta al dettaglio interno).
  const steamHref = `https://store.steampowered.com/app/${appId}`;

  const classes = [styles.card, className].filter(Boolean).join(" ");

  const openOnSteam = () => window.open(steamHref, "_blank", "noopener,noreferrer");

  return (
    <article className={classes} {...rest}>
      {/* Link esteso: la card intera porta al dettaglio interno /gioco/[appId]. */}
      <Link href={`/gioco/${appId}`} className={styles.cardLink} aria-label={name} />

      {/* Copertina (dal DB) + badge sconto se presente */}
      <div className={styles.cover}>
        <GameImage src={headerImage} alt={name} />
        {p.hasDiscount && <span className={styles.discount}>-{p.discount}%</span>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title} title={name}>
          {name}
        </h3>

        {/* Prezzo + pulsante d'acquisto (sopra il link esteso) */}
        <div className={styles.footer}>
          <div className={styles.price}>
            {p.isFree ? (
              <span className={styles.free}>{t("store.free")}</span>
            ) : (
              <>
                {p.hasDiscount && <span className={styles.priceOld}>{p.original}</span>}
                <span className={styles.priceNow}>{p.final}</span>
              </>
            )}
          </div>

          <Button
            size="sm"
            fullWidth
            iconLeft={<SteamIcon size={16} />}
            onClick={openOnSteam}
            aria-label={`${p.isFree ? t("store.getOnSteam") : t("store.buyOnSteam")} — ${name}`}
          >
            {p.isFree ? t("store.getOnSteam") : t("store.buyOnSteam")}
          </Button>
        </div>
      </div>
    </article>
  );
}