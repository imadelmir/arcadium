import { useTranslation } from "react-i18next";
import Link from "next/link";

import { GameImage } from "@/components/GameImage/GameImage";
import { Button } from "@/components/Button/Button";
import { formatPrice, platformsOf } from "@/lib/format";
import styles from "./StoreCard.module.css";

// StoreCard — card di un gioco nel negozio (M5 - T8), COLLEGATA al backend (M5-T13).
// -----------------------------------------------------------------------------
// Riceve i campi reali di GameSummaryResponse:
//   { appId, name, headerImage, price, discount, windows, mac, linux, genres }
// Il prezzo dal backend è in EURO (es. 19.99), 0 = gratis. La copertina è
// headerImage (URL del DB).
//
// M6-T5: gerarchia ribaltata, come su Steam.
//   - la PIATTAFORMA scende a testo piccolo e grigio, subito sotto il titolo:
//     è un dettaglio tecnico, prima aveva un badge acceso che rubava l'occhio;
//   - i GENERI passano da riga di testo grigia a CHIP in evidenza: sono
//     l'informazione che fa scegliere un gioco.

// Numero massimo di generi mostrati: oltre tre la riga andrebbe a capo e le
// card perderebbero l'altezza uniforme. Il resto resta nel title="".
const MAX_GENRES = 3;

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
  const { appId, name, headerImage, price = 0, discount = 0, genres = [] } = game;

  // Codici piattaforma presenti (es. ["windows", "mac"]); il MAIUSCOLO è gestito
  // via CSS (text-transform), così l'etichetta resta il dato originale.
  const platforms = platformsOf(game);

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

        {/* M6-T5: piattaforma in testo piccolo e grigio, non più badge acceso.
            Sta sopra ai generi: è la riga più discreta e fa da sottotitolo
            tecnico, mentre i chip dei generi restano l'elemento in evidenza. */}
        {platforms.length > 0 && (
          <ul className={styles.platforms}>
            {platforms.map((code) => (
              <li key={code} className={styles.platform}>
                {code}
              </li>
            ))}
          </ul>
        )}

        {/* M6-T5: generi in evidenza come chip (stile Steam). Al massimo tre,
            così la riga non va a capo e le card restano tutte alte uguali;
            l'elenco completo resta nel title="" al passaggio del mouse. */}
        {genres.length > 0 && (
          <ul className={styles.genres} title={genres.join(", ")}>
            {genres.slice(0, MAX_GENRES).map((g) => (
              <li key={g} className={styles.genre}>
                {g}
              </li>
            ))}
          </ul>
        )}

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