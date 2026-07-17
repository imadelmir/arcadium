"use client";

// =============================================================================
// Pagina dettaglio gioco · Rotta: /gioco/[appId] · (M5 - T9) COLLEGATA (M5-T13)
// -----------------------------------------------------------------------------
// Carica il gioco VERO da GET /api/games/{appId} (GameDetailResponse) e collega
// le azioni reali: Wishlist (POST/DELETE /api/wishlist/{appId}) e Backlog
// (POST/DELETE /api/backlog/{appId}). Nessun dato mock.
//
// Adattamenti rispetto ai dati del backend:
//   - genres/tags/categories/developers/publishers sono array di { id, name }:
//     qui estraggo solo i nomi;
//   - le piattaforme arrivano come booleani windows/mac/linux;
//   - il prezzo è in centesimi: lo formatta formatPrice (lib/format).
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Heart, ListPlus, Check, ExternalLink, Calendar, Code2,
  Building2, Trophy, Star, Gamepad2,
} from "lucide-react";

import { Button, Card, Badge, GameImage, Spinner } from "@/components";
import { formatPrice } from "@/lib/format";
import { getGame } from "@/lib/api/games";
import { addToWishlist, removeFromWishlist, listWishlist } from "@/lib/api/wishlist";
import { addToBacklog, removeFromBacklog, listBacklog } from "@/lib/api/backlog";
import { ApiError } from "@/lib/api/client";
import styles from "./gioco.module.css";

export default function GameDetailPage() {
  const { t, i18n } = useTranslation();
  const { appId } = useParams(); // stringa dall'URL

  // Dati del gioco + stati di caricamento.
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Stato delle azioni utente (riflettono il DB dopo il controllo iniziale).
  const [inWishlist, setInWishlist] = useState(false);
  const [inBacklog, setInBacklog] = useState(false);
  const [busyWishlist, setBusyWishlist] = useState(false);
  const [busyBacklog, setBusyBacklog] = useState(false);

  // Carica il gioco dal backend quando cambia l'appId.
  useEffect(() => {
    let attivo = true;
    // M6-T4: il caricamento vive dentro una funzione asincrona. L'effetto rigira
    // a ogni cambio dipendenze e lo spinner deve ricomparire, quindi il setState
    // serve: qui non e' piu' nel corpo sincrono dell'effetto.
    const carica = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await getGame(appId);
        if (attivo) setGame(data);
      } catch {
        if (attivo) setError(true);
      } finally {
        if (attivo) setLoading(false);
      }
    };
    carica();
    return () => { attivo = false; };
  }, [appId]);

  // All'apertura controlla se il gioco è già in wishlist e/o nel backlog,
  // così i due pulsanti partono con lo stato corretto.
  useEffect(() => {
    let attivo = true;
    const id = Number(appId);
    listWishlist()
      .then((list) => attivo && setInWishlist(list.some((w) => w.game.appId === id)))
      .catch(() => {});
    listBacklog()
      .then((list) => attivo && setInBacklog(list.some((b) => b.game.appId === id)))
      .catch(() => {});
    return () => { attivo = false; };
  }, [appId]);

  // Riepilogo recensioni (da positive/negative reali del backend).
  const review = useMemo(() => summarizeReviews(game, t), [game, t]);

  // --- Stati di pagina: caricamento / errore / non trovato -------------------
  if (loading) {
    return (
      <div className={styles.page}>
        <BackToStore t={t} />
        <div style={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !game) {
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

  // --- Adattamento dati backend ---------------------------------------------
  // Array di { id, name } -> array di nomi (con default sicuri se mancano).
  const names = (arr) => (arr ?? []).map((x) => x.name);
  const genres = names(game.genres);
  const tags = names(game.tags);
  const categories = names(game.categories);
  const developers = names(game.developers);
  const publishers = names(game.publishers);

  // Prezzo (centesimi -> euro) e sconto.
  const price = formatPrice(game.price, game.discount);

  // Link ufficiale a Steam.
  const steamUrl = `https://store.steampowered.com/app/${game.appId}`;

  // --- Handler Wishlist (reale) ----------------------------------------------
  async function toggleWishlist() {
    if (busyWishlist) return;
    setBusyWishlist(true);
    const prossimo = !inWishlist;
    setInWishlist(prossimo); // ottimistico
    try {
      if (prossimo) await addToWishlist(game.appId);
      else await removeFromWishlist(game.appId);
    } catch (err) {
      // 409 = già presente: lo teniamo "aggiunto"; altrimenti annulliamo.
      if (!(err instanceof ApiError && err.status === 409)) setInWishlist(!prossimo);
    } finally {
      setBusyWishlist(false);
    }
  }

  // --- Handler Backlog (reale) -----------------------------------------------
  async function toggleBacklog() {
    if (busyBacklog) return;
    setBusyBacklog(true);
    const prossimo = !inBacklog;
    setInBacklog(prossimo); // ottimistico
    try {
      if (prossimo) await addToBacklog(game.appId); // stato iniziale "mai_giocato"
      else await removeFromBacklog(game.appId);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 409)) setInBacklog(!prossimo);
    } finally {
      setBusyBacklog(false);
    }
  }

  return (
    <div className={styles.page}>
      <BackToStore t={t} />

      {/* HERO: sfondo sfocato + cover + titolo e meta */}
      <section className={styles.hero}>
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

            {/* Header snello (fix duplicazione con la sidebar): qui resta solo
                l'informazione che NON è già altrove nella pagina — la
                valutazione, che non compare nella card di destra. Sviluppatore,
                data di uscita, generi, tag e categorie vivono tutti nella
                sidebar (card acquisto), zero ripetizioni. */}
            {/* Recensioni nell'header (non più duplicate più sotto nel corpo):
                etichetta + conteggio + barra, subito sotto il titolo. */}
            {review.total > 0 && (
              <div className={styles.heroReviews}>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel} style={{ color: review.color }}>
                    {review.label}
                  </span>
                  <span className={styles.reviewCount}>
                    {review.percent}% {t("gameDetail.reviewOf")}{" "}
                    {formatNumber(review.total, i18n.language)} {t("gameDetail.reviewWord")}
                  </span>
                </div>
                <div className={styles.reviewBar} role="img" aria-label={`${review.percent}%`}>
                  <span style={{ width: `${review.percent}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CORPO */}
      <div className={styles.body}>
        <main className={styles.main}>
          {/* Descrizione */}
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>{t("gameDetail.about")}</h2>
            <p className={styles.about}>{game.aboutTheGame}</p>
          </section>

          {/* Screenshot (dal backend) */}
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

          {/* Recensioni: spostate nell'header, subito sotto il titolo. */}

          {/* Tag e Categorie (fix duplicazione: spostati nella sidebar, insieme
              ai Generi — un solo posto per tutte le "etichette" del gioco). */}
        </main>

        {/* CARD ACQUISTO (sticky) */}
        <aside className={styles.aside}>
          <Card className={styles.buyCard}>
            <div className={styles.priceRow}>
              {price.isFree ? (
                <span className={styles.free}>{t("gameDetail.free")}</span>
              ) : price.hasDiscount ? (
                <>
                  <Badge tone="success" className={styles.discount}>-{price.discount}%</Badge>
                  <span className={styles.priceOld}>{price.original}</span>
                  <span className={styles.priceNow}>{price.final}</span>
                </>
              ) : (
                <span className={styles.priceNow}>{price.original}</span>
              )}
            </div>

            <div className={styles.actions}>
              {/* Wishlist reale */}
              <Button
                variant={inWishlist ? "primary" : "secondary"}
                fullWidth
                disabled={busyWishlist}
                iconLeft={inWishlist ? <Check size={18} /> : <Heart size={18} />}
                aria-pressed={inWishlist}
                onClick={toggleWishlist}
              >
                {inWishlist ? t("gameDetail.inWishlist") : t("gameDetail.addWishlist")}
              </Button>

              {/* Backlog reale */}
              <Button
                variant={inBacklog ? "primary" : "secondary"}
                fullWidth
                disabled={busyBacklog}
                iconLeft={inBacklog ? <Check size={18} /> : <ListPlus size={18} />}
                aria-pressed={inBacklog}
                onClick={toggleBacklog}
              >
                {inBacklog ? t("gameDetail.inBacklog") : t("gameDetail.addBacklog")}
              </Button>

              {/* CTA Steam */}
              <a href={steamUrl} target="_blank" rel="noopener noreferrer" className={styles.steamLink}>
                <Button fullWidth iconRight={<ExternalLink size={18} />}>
                  {t("gameDetail.viewOnSteam")}
                </Button>
              </a>
            </div>

            {/* Scheda tecnica */}
            <dl className={styles.specs}>
              <SpecRow icon={<Calendar size={16} />} label={t("gameDetail.releaseDate")} value={formatDate(game.releaseDate, i18n.language)} />
              {developers.length > 0 && (
                <SpecRow icon={<Code2 size={16} />} label={t("gameDetail.developer")} value={developers.join(", ")} />
              )}
              {publishers.length > 0 && (
                <SpecRow icon={<Building2 size={16} />} label={t("gameDetail.publisher")} value={publishers.join(", ")} />
              )}
              <SpecRow icon={<Gamepad2 size={16} />} label={t("gameDetail.platforms")} value={platformList(game)} />
              {game.achievementsCount > 0 && (
                <SpecRow icon={<Trophy size={16} />} label={t("gameDetail.achievements")} value={String(game.achievementsCount)} />
              )}
              {game.metacriticScore > 0 && (
                <SpecRow
                  icon={<Star size={16} />}
                  label={t("gameDetail.metacritic")}
                  value={
                    <span className={styles.metacritic} style={{ background: metacriticColor(game.metacriticScore) }}>
                      {game.metacriticScore}
                    </span>
                  }
                />
              )}
            </dl>

            {/* Generi, Tag, Categorie — consolidati qui (fix duplicazione con
                l'header): un solo posto per tutte le "etichette" del gioco. */}
            {genres.length > 0 && (
              <div className={styles.sideGroup}>
                <p className={styles.sideGroupTitle}>{t("gameDetail.genres")}</p>
                <div className={styles.chips}>
                  {genres.map((g) => (
                    <Badge key={g} tone="primary">{g}</Badge>
                  ))}
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div className={styles.sideGroup}>
                <p className={styles.sideGroupTitle}>{t("gameDetail.tags")}</p>
                <div className={styles.chips}>
                  {tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {categories.length > 0 && (
              <div className={styles.sideGroup}>
                <p className={styles.sideGroupTitle}>{t("gameDetail.categories")}</p>
                <div className={styles.chips}>
                  {categories.map((c) => (
                    <Badge key={c} tone="neutral">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ============================ Supporto =======================================

function BackToStore({ t }) {
  return (
    <Link href="/negozio" className={styles.back}>
      <ArrowLeft size={18} aria-hidden="true" />
      {t("gameDetail.back")}
    </Link>
  );
}

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

// Percentuale, etichetta e colore dalle recensioni (positive/negative).
function summarizeReviews(game, t) {
  if (!game) return { percent: 0, total: 0, label: "", color: "var(--color-text-muted)" };
  const total = (game.positive ?? 0) + (game.negative ?? 0);
  const percent = total > 0 ? Math.round((game.positive / total) * 100) : 0;
  let key = "mixed";
  let color = "var(--color-warning)";
  if (percent >= 85) { key = "veryPositive"; color = "var(--color-success)"; }
  else if (percent >= 70) { key = "positive"; color = "var(--color-success)"; }
  else if (percent < 40) { key = "negative"; color = "var(--color-danger)"; }
  return { percent, total, label: t(`gameDetail.rating.${key}`), color };
}

function metacriticColor(score) {
  if (score >= 75) return "var(--color-success)";
  if (score >= 50) return "var(--color-warning)";
  return "var(--color-danger)";
}

// Piattaforme dai booleani del backend.
function platformList({ windows, mac, linux }) {
  const list = [];
  if (windows) list.push("Windows");
  if (mac) list.push("macOS");
  if (linux) list.push("Linux");
  return list.join(" · ") || "—";
}

function formatDate(iso, lang) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" });
}

function formatNumber(n, lang) {
  return new Intl.NumberFormat(lang).format(n);
}