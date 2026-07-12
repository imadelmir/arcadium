"use client";

// Pagina Achievement (M5-T14) — stile "trophy room" moderno con animazioni.
// Dati reali da GET /api/achievements. Riepilogo animato, filtri, griglia oro.

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trophy, Lock, Award, Target, Sparkles, Share2 } from "lucide-react";

import { Spinner } from "@/components";
import { useAuth } from "@/context/AuthProvider";
import { listAchievements } from "@/lib/api/achievements";
import styles from "./achievement.module.css";

// Piccolo hook: fa "contare" un numero da 0 al valore finale (animazione).
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easing morbido
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export default function AchievementPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtro, setFiltro] = useState("all");
  const [copied, setCopied] = useState(false);

  // Carica gli achievement dell'utente loggato dal backend.
  useEffect(() => {
    let attivo = true;
    setLoading(true);
    setError(false);
    listAchievements()
      .then((list) => attivo && setItems(list))
      .catch(() => attivo && setError(true))
      .finally(() => attivo && setLoading(false));
    return () => { attivo = false; };
  }, []);

  // Riepilogo: sbloccati, totale, punti, percentuale.
  const riepilogo = useMemo(() => {
    const totale = items.length;
    const sbloccati = items.filter((a) => a.unlocked).length;
    const punti = items.filter((a) => a.unlocked).reduce((s, a) => s + (a.points ?? 0), 0);
    const perc = totale > 0 ? Math.round((sbloccati / totale) * 100) : 0;
    return { totale, sbloccati, punti, perc };
  }, [items]);

  // Numeri animati (contatore).
  const nSbloccati = useCountUp(riepilogo.sbloccati);
  const nPerc = useCountUp(riepilogo.perc);
  const nPunti = useCountUp(riepilogo.punti);

  // Lista filtrata.
  const visibili = useMemo(() => {
    if (filtro === "unlocked") return items.filter((a) => a.unlocked);
    if (filtro === "locked") return items.filter((a) => !a.unlocked);
    return items;
  }, [items, filtro]);

  // Condivisione del proprio profilo achievement.
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/profilo/${encodeURIComponent(user?.username || "")}`
    : "";
  const shareText = lang === "en"
    ? `I unlocked ${riepilogo.sbloccati} achievements on Arcadium!`
    : `Ho sbloccato ${riepilogo.sbloccati} achievement su Arcadium!`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  function copyLink() {
    navigator?.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className={styles.page}>
      {/* HERO */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <span className={styles.kicker}>
              <Sparkles size={14} /> {lang === "en" ? "Trophy room" : "Sala trofei"}
            </span>
            <h1 className={styles.title}>{t("achievements.title")}</h1>
            <p className={styles.heroSub}>
              {riepilogo.sbloccati}/{riepilogo.totale} · {riepilogo.punti} {t("achievements.points")}
            </p>

            {/* Barra completamento animata */}
            <div className={styles.heroBar}>
              <span style={{ width: loading ? "0%" : `${riepilogo.perc}%` }} />
            </div>
          </div>

          {/* Coppa grande con glow */}
          <div className={styles.heroTrophy}>
            <Trophy size={56} />
            <span className={styles.heroPerc}>{nPerc}%</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.state}><Spinner size="lg" /></div>
      ) : error ? (
        <div className={styles.state}>{t("errors.network")}</div>
      ) : (
        <>
          {/* Riepilogo + condivisione */}
          <div className={styles.summary}>
            <div className={styles.statCard}>
              <Award size={20} className={styles.statIcon} />
              <div className={styles.statValue}>{nSbloccati}<span className={styles.statOf}>/{riepilogo.totale}</span></div>
              <div className={styles.statLabel}>{t("achievements.unlocked")}</div>
            </div>
            <div className={styles.statCard}>
              <Target size={20} className={styles.statIcon} />
              <div className={styles.statValue}>{nPerc}%</div>
              <div className={styles.statLabel}>{t("achievements.completion")}</div>
            </div>
            <div className={styles.statCard}>
              <Trophy size={20} className={styles.statIcon} />
              <div className={styles.statValue}>{nPunti}</div>
              <div className={styles.statLabel}>{t("achievements.points")}</div>
            </div>

            {/* Card condivisione: icona share + pulsanti grandi centrati */}
            <div className={styles.shareCard}>
              <span className={styles.shareTitle}>{t("achievements.share")}</span>
              <div className={styles.shareRow}>
                <Share2 size={18} className={styles.shareIcon} />
                <a className={`${styles.shareBtn} ${styles.fb}`} href={fbHref} target="_blank" rel="noopener noreferrer">Facebook</a>
                <button type="button" className={`${styles.shareBtn} ${styles.ig}`} onClick={copyLink}>
                  {copied ? (lang === "en" ? "Copied!" : "Copiato!") : "Instagram"}
                </button>
                <a className={`${styles.shareBtn} ${styles.x}`} href={xHref} target="_blank" rel="noopener noreferrer">X</a>
              </div>
            </div>
          </div>

          {/* Filtri */}
          <div className={styles.filters}>
            {["all", "unlocked", "locked"].map((f) => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filtro === f ? styles.filterActive : ""}`}
                onClick={() => setFiltro(f)}
              >
                {t(`achievements.filter.${f}`)}
              </button>
            ))}
          </div>

          {/* Griglia achievement */}
          {visibili.length === 0 ? (
            <div className={styles.state}>{t("achievements.empty")}</div>
          ) : (
            <div className={styles.grid}>
              {visibili.map((a, i) => {
                const pct = a.threshold > 0 ? Math.min(100, Math.round((a.progress / a.threshold) * 100)) : 0;
                const name = lang === "en" ? a.nameEn : a.nameIt;
                const desc = lang === "en" ? a.descriptionEn : a.descriptionIt;
                return (
                  <div
                    key={a.code}
                    className={`${styles.card} ${a.unlocked ? styles.cardUnlocked : ""}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {a.unlocked && <span className={styles.shine} aria-hidden="true" />}
                    <div className={`${styles.icon} ${a.unlocked ? styles.iconOn : ""}`}>
                      {a.unlocked ? <Trophy size={24} /> : <Lock size={20} />}
                    </div>
                    <div className={styles.body}>
                      <div className={styles.name}>{name}</div>
                      <div className={styles.desc}>{desc}</div>
                      <div className={styles.bar}><span style={{ width: `${pct}%` }} /></div>
                      <div className={styles.progress}>
                        <span>{a.progress}/{a.threshold}</span>
                        <span className={styles.points}>{a.points} pt</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}