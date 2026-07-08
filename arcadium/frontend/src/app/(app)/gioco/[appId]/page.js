"use client";

// =============================================================================
// Pagina dettaglio gioco  ·  Rotta:  /gioco/[appId]        (M5 - T9)
// -----------------------------------------------------------------------------
// Mostra una singola scheda gioco fedele al mockup:
//   - HERO immersivo: cover a fuoco su sfondo sfocato ricavato dalla stessa
//     immagine, con titolo, sviluppatore e dati rapidi (uscita, recensioni).
//   - Colonna SINISTRA: descrizione, generi, tag, categorie, recensioni Steam.
//   - Colonna DESTRA (card acquisto "appiccicata"): prezzo con eventuale
//     sconto, azioni Wishlist / Backlog, CTA "Vedi su Steam", scheda tecnica
//     (data, sviluppatore, publisher, piattaforme, Metacritic, achievement).
//
// In attesa del backend i dati arrivano da mockGameDetail.js: ha la stessa
// forma dell'endpoint futuro (M4 - T6), quindi l'aggancio all'API sara' la
// sostituzione della sola sorgente dati, senza toccare la UI.
//
// Tecnologia: JavaScript + CSS Modules. Riusa il design system (M5 - T2),
// il componente GameImage (M5 - T7), l'i18n IT/EN (M5 - T3) e l'utility
// prezzi utils/price.js (M5 - T8).
// =============================================================================

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Heart,
  ListPlus,
  Check,
  ExternalLink,
  Calendar,
  Code2,
  Building2,
  Trophy,
  Star,
  ThumbsUp,
  Gamepad2,
} from "lucide-react";

import { Button, Card, Badge, GameImage } from "@/components";
import { formatPrice, discountedPrice } from "@/utils/price";
import { getGameById } from "./mockGameDetail";
import styles from "./gioco.module.css";

export default function GameDetailPage() {
  const { t } = useTranslation();

  // L'appId arriva dall'URL (cartella [appId]) ed e' sempre una stringa.
  const { appId } = useParams();

  // Cerca il gioco nel dataset finto (in futuro: fetch all'endpoint).
  const game = getGameById(appId);

  // Stato locale delle azioni utente. Senza backend teniamo tutto in memoria:
  // wishlist e' un semplice on/off, il backlog e' uno dei quattro stati noti.
  const [inWishlist, setInWishlist] = useState(false);
  const [backlogStatus, setBacklogStatus] = useState(null);

  // Riepilogo recensioni Steam calcolato una sola volta (o al cambio gioco):
  // percentuale di positive + etichetta testuale ("Molto positive", ...).
  const review = useMemo(() => summarizeReviews(game, t), [game, t]);

  // ---------------------------------------------------------------------------
  // Stato "non trovato": appId inesistente nel catalogo finto.
  // ---------------------------------------------------------------------------
  if (!game) {
    return (
      <div className={styles.page}>
        <BackToStore t={t} />
        <Card className={styles.notFound}>
          <Gamepad2 className={styles.notFoundIcon} aria-hidden="true" />
          <h1 className={styles.notFoundTitle}>{t("gameDetail.notFound.title")}</h1>
          <p className={styles.notFoundText}>{t("gameDetail.notFound.text")}</p>
          <Link href="/negozio">
            <Button>{t("gameDetail.notFound.cta")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Prezzo finale (in centesimi) applicando lo sconto, e flag di comodo.
  const isFree = game.priceCents === 0;
  const hasDiscount = game.discount > 0 && !isFree;
  const finalCents = hasDiscount
    ? discountedPrice(game.priceCents, game.discount)
    : game.priceCents;

  // Link ufficiale alla scheda Steam del gioco (aperto in nuova scheda).
  const steamUrl = `https://store.steampowered.com/app/${game.appId}`;

  return (
    <div className={styles.page}>
      <BackToStore t={t} />

      {/* ------------------------------------------------------------------ */}
      {/* HERO: sfondo sfocato + cover a fuoco + titolo e meta principali.    */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.hero}>
        {/* Sfondo ambientale: la stessa cover, ingrandita e sfocata, dietro. */}
        <div
          className={styles.heroBackdrop}
          style={{ backgroundImage: `url(${game.headerImage})` }}
          aria-hidden="true"
        />
        <div className={styles.heroScrim} aria-hidden="true" />

        <div className={styles.heroContent}>
          <div className={styles.heroCover}>
            <GameImage src={game.headerImage} alt={game.name} />
          </div>

          <div className={styles.heroText}>
            <h1 className={styles.title}>{game.name}</h1>

            <p className={styles.byline}>
              {t("gameDetail.by")} <strong>{game.developers.join(", ")}</strong>
            </p>

            {/* Dati rapidi: recensioni, anno di uscita, generi principali. */}
            <div className={styles.heroMeta}>
              <span className={styles.metaItem}>
                <ThumbsUp className={styles.metaIcon} aria-hidden="true" />
                <span style={{ color: review.color }}>{review.label}</span>
                <span className={styles.metaMuted}>({review.percent}%)</span>
              </span>
              <span className={styles.metaDot} aria-hidden="true" />
              <span className={styles.metaItem}>
                <Calendar className={styles.metaIcon} aria-hidden="true" />
                {formatDate(game.releaseDate)}
              </span>
            </div>

            <div className={styles.heroGenres}>
              {game.genres.map((g) => (
                <Badge key={g} tone="primary">
                  {g}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CORPO: contenuti a sinistra, card acquisto (sticky) a destra.       */}
      {/* ------------------------------------------------------------------ */}
      <div className={styles.body}>
        <main className={styles.main}>
          {/* Descrizione ---------------------------------------------------- */}
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>{t("gameDetail.about")}</h2>
            <p className={styles.about}>{game.aboutTheGame}</p>
          </section>

          {/* Striscia multimediale (se presente) ---------------------------- */}
          {game.screenshots?.length > 0 && (
            <section className={styles.block}>
              <h2 className={styles.blockTitle}>{t("gameDetail.media")}</h2>
              <div className={styles.media}>
                {game.screenshots.map((src, i) => (
                  <div key={i} className={styles.shot}>
                    <GameImage src={src} alt={`${game.name} — ${i + 1}`} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recensioni Steam (barra positive/negative) --------------------- */}
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>{t("gameDetail.reviews")}</h2>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel} style={{ color: review.color }}>
                {review.label}
              </span>
              <span className={styles.reviewCount}>
                {review.percent}% {t("gameDetail.reviewOf")}{" "}
                {formatNumber(review.total)} {t("gameDetail.reviewWord")}
              </span>
            </div>
            <div
              className={styles.reviewBar}
              role="img"
              aria-label={`${review.percent}% positive`}
            >
              <span style={{ width: `${review.percent}%` }} />
            </div>
          </section>

          {/* Tag e categorie ------------------------------------------------ */}
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>{t("gameDetail.tags")}</h2>
            <div className={styles.chips}>
              {game.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </section>

          <section className={styles.block}>
            <h2 className={styles.blockTitle}>{t("gameDetail.categories")}</h2>
            <div className={styles.chips}>
              {game.categories.map((c) => (
                <Badge key={c} tone="neutral">
                  {c}
                </Badge>
              ))}
            </div>
          </section>
        </main>

        {/* ---------------------------------------------------------------- */}
        {/* CARD ACQUISTO: resta visibile durante lo scorrimento (sticky).   */}
        {/* ---------------------------------------------------------------- */}
        <aside className={styles.aside}>
          <Card className={styles.buyCard}>
            {/* Prezzo: Gratis / scontato (barrato + finale) / prezzo pieno. */}
            <div className={styles.priceRow}>
              {isFree ? (
                <span className={styles.free}>{t("gameDetail.free")}</span>
              ) : hasDiscount ? (
                <>
                  <Badge tone="success" className={styles.discount}>
                    -{game.discount}%
                  </Badge>
                  <span className={styles.priceOld}>{formatPrice(game.priceCents)}</span>
                  <span className={styles.priceNow}>{formatPrice(finalCents)}</span>
                </>
              ) : (
                <span className={styles.priceNow}>{formatPrice(game.priceCents)}</span>
              )}
            </div>

            {/* Azioni utente (per ora solo stato locale, senza backend). */}
            <div className={styles.actions}>
              <Button
                variant={inWishlist ? "primary" : "secondary"}
                fullWidth
                iconLeft={
                  inWishlist ? <Check size={18} /> : <Heart size={18} />
                }
                aria-pressed={inWishlist}
                onClick={() => setInWishlist((v) => !v)}
              >
                {inWishlist
                  ? t("gameDetail.inWishlist")
                  : t("gameDetail.addWishlist")}
              </Button>

              <Button
                variant={backlogStatus ? "primary" : "secondary"}
                fullWidth
                iconLeft={
                  backlogStatus ? <Check size={18} /> : <ListPlus size={18} />
                }
                aria-pressed={Boolean(backlogStatus)}
                onClick={() =>
                  setBacklogStatus((s) => (s ? null : "never"))
                }
              >
                {backlogStatus
                  ? t("gameDetail.inBacklog")
                  : t("gameDetail.addBacklog")}
              </Button>

              {/* CTA principale: apre la scheda ufficiale su Steam. */}
              <a
                href={steamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.steamLink}
              >
                <Button fullWidth iconRight={<ExternalLink size={18} />}>
                  {t("gameDetail.viewOnSteam")}
                </Button>
              </a>
            </div>

            {/* Scheda tecnica: righe etichetta / valore. */}
            <dl className={styles.specs}>
              <SpecRow
                icon={<Calendar size={16} />}
                label={t("gameDetail.releaseDate")}
                value={formatDate(game.releaseDate)}
              />
              <SpecRow
                icon={<Code2 size={16} />}
                label={t("gameDetail.developer")}
                value={game.developers.join(", ")}
              />
              <SpecRow
                icon={<Building2 size={16} />}
                label={t("gameDetail.publisher")}
                value={game.publishers.join(", ")}
              />
              <SpecRow
                icon={<Gamepad2 size={16} />}
                label={t("gameDetail.platforms")}
                value={platformList(game.platforms)}
              />
              {game.achievementsCount > 0 && (
                <SpecRow
                  icon={<Trophy size={16} />}
                  label={t("gameDetail.achievements")}
                  value={String(game.achievementsCount)}
                />
              )}
              {game.metacriticScore > 0 && (
                <SpecRow
                  icon={<Star size={16} />}
                  label={t("gameDetail.metacritic")}
                  value={
                    <span
                      className={styles.metacritic}
                      style={{ background: metacriticColor(game.metacriticScore) }}
                    >
                      {game.metacriticScore}
                    </span>
                  }
                />
              )}
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// =============================================================================
// Sotto-componenti e funzioni di supporto (piccoli, quindi qui co-locati).
// =============================================================================

// Link "Torna al negozio" mostrato in cima alla pagina.
function BackToStore({ t }) {
  return (
    <Link href="/negozio" className={styles.back}>
      <ArrowLeft size={18} aria-hidden="true" />
      {t("gameDetail.back")}
    </Link>
  );
}

// Riga della scheda tecnica: icona + etichetta a sinistra, valore a destra.
function SpecRow({ icon, label, value }) {
  return (
    <div className={styles.specRow}>
      <dt className={styles.specLabel}>
        <span className={styles.specIcon}>{icon}</span>
        {label}
      </dt>
      <dd className={styles.specValue}>{value}</dd>
    </div>
  );
}

// Ricava percentuale, etichetta tradotta e colore dalle recensioni Steam.
function summarizeReviews(game, t) {
  if (!game) return { percent: 0, total: 0, label: "", color: "var(--color-text-muted)" };

  const total = game.positive + game.negative;
  const percent = total > 0 ? Math.round((game.positive / total) * 100) : 0;

  // Fasce ispirate a Steam: molto positive / positive / nella media / negative.
  let key = "mixed";
  let color = "var(--color-warning)";
  if (percent >= 85) {
    key = "veryPositive";
    color = "var(--color-success)";
  } else if (percent >= 70) {
    key = "positive";
    color = "var(--color-success)";
  } else if (percent < 40) {
    key = "negative";
    color = "var(--color-danger)";
  }

  return { percent, total, label: t(`gameDetail.rating.${key}`), color };
}

// Colore del badge Metacritic secondo la loro convenzione (verde/giallo/rosso).
function metacriticColor(score) {
  if (score >= 75) return "var(--color-success)";
  if (score >= 50) return "var(--color-warning)";
  return "var(--color-danger)";
}

// Trasforma le piattaforme booleane in una stringa leggibile.
function platformList({ windows, mac, linux }) {
  const list = [];
  if (windows) list.push("Windows");
  if (mac) list.push("macOS");
  if (linux) list.push("Linux");
  return list.join(" · ") || "—";
}

// Formatta una data ISO ("2022-02-25") nel formato locale italiano.
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Formatta grandi numeri con i separatori italiani (12.480, 1.640.500).
function formatNumber(n) {
  return new Intl.NumberFormat("it-IT").format(n);
}