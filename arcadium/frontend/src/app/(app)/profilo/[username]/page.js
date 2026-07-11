"use client";

// Pagina profilo utente (M5-T13) — /profilo/[username].
// Dati, statistiche, "sto giocando", achievement (solo sul proprio profilo) e
// condivisione social.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Lock, Trophy, Share2 } from "lucide-react";

import { Avatar, GameImage, Spinner } from "@/components";
import { useAuth } from "@/context/AuthProvider";
import { getUserProfile, getUserBacklog } from "@/lib/api/users";
import { getMyStats } from "@/lib/api/stats";
import { listAchievements } from "@/lib/api/achievements";
import { ApiError } from "@/lib/api/client";
import { formatDate, playtimeLabel } from "@/lib/format";
import styles from "./profilo.module.css";

export default function ProfiloPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { user } = useAuth();
  const params = useParams();
  const username = decodeURIComponent(params.username);

  const isMe = Boolean(user?.username && user.username === username);

  const [profile, setProfile] = useState(null);
  const [backlog, setBacklog] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [privato, setPrivato] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let attivo = true;
    setLoading(true);
    setNotFound(false);
    setPrivato(false);

    getUserProfile(username)
      .then((p) => attivo && setProfile(p))
      .catch((err) => {
        if (attivo && err instanceof ApiError && err.status === 404) setNotFound(true);
      });

    getUserBacklog(username)
      .then((list) => attivo && setBacklog(list))
      .catch((err) => {
        if (attivo && err instanceof ApiError && err.status === 403) setPrivato(true);
      })
      .finally(() => attivo && setLoading(false));

    if (user?.username === username) {
      getMyStats().then((s) => attivo && setMyStats(s)).catch(() => {});
      listAchievements().then((a) => attivo && setAchievements(a)).catch(() => {});
    }

    return () => {
      attivo = false;
    };
  }, [username, user]);

  const nome = profile?.displayName || profile?.username || username;

  const stats =
    isMe && myStats
      ? {
          games: myStats.gamesOwned,
          playing: myStats.byStatus.find((s) => s.code === "in_corso")?.count ?? 0,
          hours: myStats.playtimeHours,
          genres: myStats.distinctGenres,
        }
      : {
          games: backlog.length,
          playing: backlog.filter((b) => b.status.code === "in_corso").length,
          hours: Math.round(backlog.reduce((s, b) => s + (b.playtimeMinutes ?? 0), 0) / 60),
          genres: null,
        };

  const playing = backlog.filter((b) => b.status.code === "in_corso");

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = lang === "en" ? `Check out ${nome} on Arcadium` : `Guarda ${nome} su Arcadium`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  function copyLink() {
    navigator?.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.state}><Spinner size="lg" /></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={styles.page}>
        <Link href="/community" className={styles.back}><ArrowLeft size={18} />{t("community.backToList")}</Link>
        <div className={styles.state}><p>{lang === "en" ? "User not found." : "Utente non trovato."}</p></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/community" className={styles.back}><ArrowLeft size={18} />{t("community.backToList")}</Link>

      {/* Testata */}
      <div className={styles.head}>
        <Avatar name={nome} src={profile?.avatarUrl} size="lg" />
        <div className={styles.headInfo}>
          <div className={styles.name}>{nome}</div>
          <div className={styles.handle}>@{profile?.username}</div>
          {profile?.createdAt && (
            <div className={styles.meta}>{lang === "en" ? "Member since " : "Membro dal "}{formatDate(profile.createdAt, lang)}</div>
          )}
          {profile && !profile.profilePublic && (
            <div className={styles.privatePill}><Lock size={12} /> {t("community.privateProfile")}</div>
          )}
        </div>

        {/* Pulsanti social glass: Facebook / Instagram / X */}
        <div className={styles.share}>
          <Share2 size={20} className={styles.shareIcon} />
          <a className={`${styles.socialBtn} ${styles.fb}`} href={fbHref} target="_blank" rel="noopener noreferrer">Facebook</a>
          <button type="button" className={`${styles.socialBtn} ${styles.ig}`} onClick={copyLink}>
            {copied ? (lang === "en" ? "Link copied!" : "Link copiato!") : "Instagram"}
          </button>
          <a className={`${styles.socialBtn} ${styles.x}`} href={xHref} target="_blank" rel="noopener noreferrer">X</a>
        </div>
      </div>

      {privato ? (
        <div className={styles.state}><Lock size={28} /><p>{t("community.privateNotice")}</p></div>
      ) : (
        <>
          {/* Statistiche */}
          <div className={styles.statGrid}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.games}</div>
              <div className={styles.statLabel}>{t("stats.kpi.totalGames")}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.playing}</div>
              <div className={styles.statLabel}>{lang === "en" ? "Playing" : "In corso"}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{playtimeLabel(stats.hours * 60)}</div>
              <div className={styles.statLabel}>{t("stats.kpi.hoursPlayed")}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.genres ?? "—"}</div>
              <div className={styles.statLabel}>{t("stats.kpi.genres")}</div>
            </div>
          </div>

          {/* Sto giocando */}
          <h2 className={styles.sectionTitle}>{lang === "en" ? "Currently playing" : "Sto giocando"}</h2>
          {playing.length === 0 ? (
            <p className={styles.note}>{lang === "en" ? "No games in progress." : "Nessun gioco in corso."}</p>
          ) : (
            <div className={styles.playingRow}>
              {playing.map(({ game }) => (
                <Link key={game.appId} href={`/gioco/${game.appId}`} className={styles.playingCard}>
                  <GameImage src={game.headerImage} alt={game.name} />
                </Link>
              ))}
            </div>
          )}

          {/* Achievement */}
          <h2 className={styles.sectionTitle}>{lang === "en" ? "Achievements" : "Achievement"}</h2>
          {isMe ? (
            achievements.length === 0 ? (
              <p className={styles.note}>{lang === "en" ? "No achievements yet." : "Ancora nessun achievement."}</p>
            ) : (
              <div className={styles.achGrid}>
                {achievements.map((a) => {
                  const pct = a.threshold > 0 ? Math.min(100, Math.round((a.progress / a.threshold) * 100)) : 0;
                  const name = lang === "en" ? a.nameEn : a.nameIt;
                  const desc = lang === "en" ? a.descriptionEn : a.descriptionIt;
                  return (
                    <div key={a.code} className={`${styles.ach} ${a.unlocked ? styles.achUnlocked : ""}`}>
                      <div className={`${styles.achIcon} ${a.unlocked ? styles.achIconOn : ""}`}><Trophy size={18} /></div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className={styles.achName}>{name}</div>
                        <div className={styles.achDesc}>{desc}</div>
                        <div className={styles.achBar}><span style={{ width: `${pct}%` }} /></div>
                        <div className={styles.achProgress}>{a.progress}/{a.threshold} · {a.points} pt</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <p className={styles.note}>{lang === "en" ? "Achievements are visible only on your own profile." : "Gli achievement sono visibili solo sul tuo profilo."}</p>
          )}
        </>
      )}
    </div>
  );
}