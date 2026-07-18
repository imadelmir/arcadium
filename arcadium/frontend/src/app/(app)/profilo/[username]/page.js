"use client";

// Pagina profilo utente (M5-T13) — /profilo/[username].
// -----------------------------------------------------------------------------
// Change request Community: il profilo di un altro utente e' visibile SOLO se
// siete amici. Finche' non lo siete si vede l'identita' (nome, handle, eventuale
// nome precedente) e il pulsante per inviare / accettare la richiesta, mentre il
// contenuto (card, "sto giocando") resta nascosto — il backend stesso risponde
// 403 sugli endpoint del contenuto.
//
// Cosa si vede sul profilo di un AMICO: nome attuale, nome precedente, le card
// (giochi, in corso, ore, achievement sbloccati) e "sto giocando".
// I pulsanti di condivisione social e il dettaglio degli achievement restano
// invece solo sul PROPRIO profilo.

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Lock, Trophy, Share2, UserPlus, UserCheck, UserX, Check } from "lucide-react";

import { Avatar, GameImage, Spinner, Button } from "@/components";
import { getUserProfile, getUserBacklog, getUserProfileStats } from "@/lib/api/users";
import { listAchievements } from "@/lib/api/achievements";
import { sendFriendRequest, acceptFriendRequest, removeFriend } from "@/lib/api/friends";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import styles from "./profilo.module.css";

export default function ProfiloPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const params = useParams();
  const username = decodeURIComponent(params.username);

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [backlog, setBacklog] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [azione, setAzione] = useState(false);   // operazione di amicizia in corso
  const [errore, setErrore] = useState(null);

  // Stato della relazione, deciso dal backend: SELF | FRIENDS | PENDING_SENT |
  // PENDING_RECEIVED | NONE.
  const stato = profile?.friendshipStatus ?? null;
  const isMe = stato === "SELF";
  const puoVedere = stato === "SELF" || stato === "FRIENDS";

  const caricaProfilo = useCallback(async () => {
    try {
      const p = await getUserProfile(username);
      setProfile(p);
      setNotFound(false);
      return p;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      return null;
    }
  }, [username]);

  // 1) Identita' + stato di amicizia: sempre.
  useEffect(() => {
    let attivo = true;
    const carica = async () => {
      setLoading(true);
      setNotFound(false);
      setErrore(null);
      setProfile(null);
      setStats(null);
      setBacklog([]);
      setAchievements([]);
      const p = await caricaProfilo();
      if (!attivo) return;
      if (!p) setProfile(null);
      setLoading(false);
    };
    carica();
    return () => { attivo = false; };
  }, [username, caricaProfilo]);

  // 2) Contenuto del profilo: solo se siete amici (o e' il proprio).
  useEffect(() => {
    if (!puoVedere) return;
    let attivo = true;

    getUserProfileStats(username)
      .then((s) => attivo && setStats(s))
      .catch(() => {});
    getUserBacklog(username)
      .then((b) => attivo && setBacklog(b))
      .catch(() => {});
    // Il dettaglio degli achievement resta solo sul proprio profilo.
    if (isMe) {
      listAchievements()
        .then((a) => attivo && setAchievements(a))
        .catch(() => {});
    }

    return () => { attivo = false; };
  }, [username, puoVedere, isMe]);

  // --- Azioni di amicizia ----------------------------------------------------
  async function azioneAmicizia(fn) {
    if (azione) return;
    setAzione(true);
    setErrore(null);
    try {
      await fn(username);
      await caricaProfilo(); // rilegge lo stato: i pulsanti si aggiornano da soli
    } catch (err) {
      setErrore(err?.message || t("errors.generic"));
    } finally {
      setAzione(false);
    }
  }

  const nome = profile?.username || username;

  // Condivisione: solo sul proprio profilo.
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = t("profile.shareText", { name: nome });
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const copiaLink = () => {
    navigator?.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const playing = backlog.filter((b) => b.status?.code === "in_corso");

  if (loading) {
    return <div className={styles.page}><div className={styles.state}><Spinner size="lg" /></div></div>;
  }

  if (notFound || !profile) {
    return (
      <div className={styles.page}>
        <Link href="/community" className={styles.back}>
          <ArrowLeft size={18} aria-hidden="true" /> {t("nav.community")}
        </Link>
        <div className={styles.state}><p>{t("profile.notFound")}</p></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/community" className={styles.back}>
        <ArrowLeft size={18} aria-hidden="true" /> {t("nav.community")}
      </Link>

      <div className={styles.head}>
        <Avatar name={nome} src={profile.avatarUrl} size="lg" />
        <div className={styles.headInfo}>
          <div className={styles.name}>{nome}</div>
          {profile.previousUsername && (
            <div className={styles.formerHandle}>
              {isMe
                ? `@${profile.previousUsername}`
                : t("profile.formerlyKnownAs", { username: profile.previousUsername })}
            </div>
          )}
          {profile.createdAt && (
            <div className={styles.meta}>{t("profile.memberSince", { date: formatDate(profile.createdAt, lang) })}</div>
          )}

          {/* Pulsanti di amicizia (mai sul proprio profilo). */}
          {!isMe && (
            <div className={styles.friendActions}>
              {stato === "NONE" && (
                <Button onClick={() => azioneAmicizia(sendFriendRequest)} disabled={azione}
                        iconLeft={<UserPlus size={16} />}>
                  {t("friends.add")}
                </Button>
              )}
              {stato === "PENDING_SENT" && (
                <>
                  <span className={styles.pendingPill}>{t("friends.requestSent")}</span>
                  <Button variant="secondary" onClick={() => azioneAmicizia(removeFriend)} disabled={azione}>
                    {t("friends.cancelRequest")}
                  </Button>
                </>
              )}
              {stato === "PENDING_RECEIVED" && (
                <>
                  <Button onClick={() => azioneAmicizia(acceptFriendRequest)} disabled={azione}
                          iconLeft={<UserCheck size={16} />}>
                    {t("friends.accept")}
                  </Button>
                  <Button variant="secondary" onClick={() => azioneAmicizia(removeFriend)} disabled={azione}
                          iconLeft={<UserX size={16} />}>
                    {t("friends.reject")}
                  </Button>
                </>
              )}
              {stato === "FRIENDS" && (
                <>
                  <span className={styles.friendPill}><Check size={12} /> {t("friends.friends")}</span>
                  <Button variant="secondary" onClick={() => azioneAmicizia(removeFriend)} disabled={azione}>
                    {t("friends.remove")}
                  </Button>
                </>
              )}
            </div>
          )}
          {errore && <p className={styles.errore}>{errore}</p>}
        </div>

        {/* Condivisione social: solo sul PROPRIO profilo. */}
        {isMe && (
          <div className={styles.share}>
            <Share2 size={20} className={styles.shareIcon} />
            <a className={`${styles.socialBtn} ${styles.fb}`} href={fbHref} target="_blank" rel="noopener noreferrer">Facebook</a>
            <button type="button" className={`${styles.socialBtn} ${styles.ig}`} onClick={copiaLink}>
              {copied ? t("common.linkCopied") : "Instagram"}
            </button>
            <a className={`${styles.socialBtn} ${styles.x}`} href={xHref} target="_blank" rel="noopener noreferrer">X</a>
          </div>
        )}
      </div>

      {!puoVedere ? (
        // Non siete amici: nessun contenuto, solo l'invito a collegarsi.
        <div className={styles.state}>
          <Lock size={28} aria-hidden="true" />
          <p>{t("profile.friendsOnly")}</p>
        </div>
      ) : (
        <>
          {/* Card del profilo: giochi, in corso, ore, achievement sbloccati. */}
          <div className={styles.statGrid}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats?.gamesOwned ?? "—"}</div>
              <div className={styles.statLabel}>{t("stats.kpi.totalGames")}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats?.playing ?? "—"}</div>
              <div className={styles.statLabel}>{t("profile.playingStat")}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>
                {stats ? `${stats.playtimeHours}${t("stats.unit.hours")}` : "—"}
              </div>
              <div className={styles.statLabel}>{t("stats.kpi.hoursPlayed")}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats?.achievementsUnlocked ?? "—"}</div>
              <div className={styles.statLabel}>{t("stats.kpi.achievements")}</div>
            </div>
          </div>

          {/* Sto giocando */}
          <h2 className={styles.sectionTitle}>{t("profile.currentlyPlaying")}</h2>
          {playing.length === 0 ? (
            <p className={styles.note}>{t("profile.noGamesInProgress")}</p>
          ) : (
            <div className={styles.playingRow}>
              {playing.map(({ game }) => (
                <Link key={game.appId} href={`/gioco/${game.appId}`} className={styles.playingCard}>
                  <GameImage src={game.headerImage} alt={game.name} />
                </Link>
              ))}
            </div>
          )}

          {/* Dettaglio achievement: solo sul PROPRIO profilo. */}
          {isMe && (
            <>
              <h2 className={styles.sectionTitle}>{t("profile.achievementsTitle")}</h2>
              {achievements.length === 0 ? (
                <p className={styles.note}>{t("profile.noAchievements")}</p>
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
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
