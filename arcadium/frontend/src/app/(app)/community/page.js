"use client";

// Pagina Community (M5-T13) — ricerca utenti, richieste e amici.
// -----------------------------------------------------------------------------
// Change request Community: l'amicizia e' su RICHIESTA + ACCETTAZIONE.
// Ordine della pagina:
//   1. barra di ricerca (in cima) e relativi risultati;
//   2. richieste di amicizia ricevute, da accettare o rifiutare;
//   3. i miei amici.
// I risultati compaiono SOLO mentre si cerca davvero: senza testo non si elenca
// nessuno, cosi' chi ha una richiesta in sospeso non compare due volte.
// Lo stato di ogni utente trovato si ricava incrociando amici / richieste
// inviate / ricevute, gia' caricati qui: la ricerca resta una sola chiamata e i
// pulsanti mostrano sempre l'azione giusta.

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Search, Lock, UserPlus, UserCheck, UserX, Check } from "lucide-react";

import { Input, Avatar, Spinner, Button } from "@/components";
import { searchUsers } from "@/lib/api/users";
import {
  listFriends, listReceivedRequests, listSentRequests,
  sendFriendRequest, acceptFriendRequest, removeFriend,
} from "@/lib/api/friends";
import { ApiError } from "@/lib/api/client";
import styles from "./community.module.css";

export default function CommunityPage() {
  const { t } = useTranslation();

  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchDisabled, setSearchDisabled] = useState(false);

  const [friends, setFriends] = useState([]);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [azione, setAzione] = useState(null); // username su cui e' in corso un'azione

  // Debounce della ricerca (aspetta che l'utente smetta di digitare).
  const [qDebounced, setQDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setQDebounced(q), 350);
    return () => clearTimeout(id);
  }, [q]);

  const staCercando = qDebounced.trim().length > 0;

  // Amici + richieste: ricaricati dopo ogni azione, cosi' le sezioni e i pulsanti
  // della ricerca restano allineati.
  const caricaRelazioni = useCallback(async () => {
    const [f, r, s] = await Promise.all([
      listFriends().catch(() => []),
      listReceivedRequests().catch(() => []),
      listSentRequests().catch(() => []),
    ]);
    setFriends(f);
    setReceived(r);
    setSent(s);
  }, []);

  useEffect(() => { caricaRelazioni(); }, [caricaRelazioni]);

  // Ricerca utenti. Si interroga il backend anche a campo vuoto (una sola volta,
  // al montaggio) per scoprire subito se la ricerca e' vietata: il backend
  // risponde 403 a chi ha il profilo privato.
  useEffect(() => {
    let attivo = true;
    const carica = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await searchUsers({ q: qDebounced.trim() || undefined, page: 0, size: 40 });
        if (attivo) {
          setUsers(res.content);
          setSearchDisabled(false);
        }
      } catch (err) {
        if (!attivo) return;
        if (err instanceof ApiError && err.status === 403) setSearchDisabled(true);
        else setError(true);
      } finally {
        if (attivo) setLoading(false);
      }
    };
    carica();
    return () => { attivo = false; };
  }, [qDebounced]);

  async function esegui(username, fn) {
    if (azione) return;
    setAzione(username);
    try {
      await fn(username);
    } catch {
      // Ignorato di proposito: si ricaricano comunque le relazioni, cosi' i
      // pulsanti tornano allo stato reale del server.
    } finally {
      await caricaRelazioni();
      setAzione(null);
    }
  }

  // Stato della relazione con un utente trovato nella ricerca.
  const statoDi = (username) => {
    if (friends.some((f) => f.username === username)) return "FRIENDS";
    if (sent.some((f) => f.username === username)) return "PENDING_SENT";
    if (received.some((f) => f.username === username)) return "PENDING_RECEIVED";
    return "NONE";
  };

  // Card utente: avatar e nome portano al profilo solo se siete amici (altrimenti
  // il profilo non mostrerebbe nulla).
  const CardUtente = ({ u, azioni }) => {
    const nome = u.username;
    const amici = friends.some((f) => f.username === u.username);
    const contenuto = (
      <>
        <Avatar name={nome} src={u.avatarUrl} size="lg" />
        <div className={styles.info}>
          <div className={styles.name}>{nome}</div>
          {u.previousUsername && (
            <div className={styles.formerHandle}>
              {t("profile.formerlyKnownAs", { username: u.previousUsername })}
            </div>
          )}
        </div>
      </>
    );
    return (
      <div className={styles.card}>
        {amici ? (
          <Link href={`/profilo/${encodeURIComponent(u.username)}`} className={styles.cardLink}>
            {contenuto}
          </Link>
        ) : (
          <div className={styles.cardLink}>{contenuto}</div>
        )}
        {azioni}
      </div>
    );
  };

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t("nav.community")}</h1>
        <p className={styles.subtitle}>{t("community.subtitle")}</p>
      </header>

      {/* 1. Ricerca utenti, in cima. */}
      {!searchDisabled && (
        <div className={styles.searchRow}>
          <Input
            name="q"
            placeholder={t("community.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            iconLeft={<Search size={16} />}
            aria-label={t("community.searchPlaceholder")}
            autoComplete="off"
          />
        </div>
      )}

      {searchDisabled ? (
        <div className={styles.state}>
          <Lock size={28} aria-hidden="true" />
          <p className={styles.disabledTitle}>{t("community.searchDisabledTitle")}</p>
          <p>{t("community.searchDisabledText")}</p>
          <Link href="/impostazioni" className={styles.disabledCta}>
            {t("community.searchDisabledCta")}
          </Link>
        </div>
      ) : staCercando ? (
        loading ? (
          <div className={styles.state}><Spinner size="lg" /></div>
        ) : error ? (
          <div className={styles.state}>{t("errors.network")}</div>
        ) : users.length === 0 ? (
          <div className={styles.state}>{t("community.noResults")}</div>
        ) : (
          <div className={styles.grid}>
            {users.map((u) => {
              const stato = statoDi(u.username);
              return (
                <CardUtente
                  key={u.username}
                  u={u}
                  azioni={
                    <div className={styles.cardActions}>
                      {stato === "NONE" && (
                        <Button size="sm" disabled={azione === u.username}
                                iconLeft={<UserPlus size={14} />}
                                onClick={() => esegui(u.username, sendFriendRequest)}>
                          {t("friends.add")}
                        </Button>
                      )}
                      {stato === "PENDING_SENT" && (
                        <span className={styles.pendingPill}>{t("friends.requestSent")}</span>
                      )}
                      {stato === "PENDING_RECEIVED" && (
                        <Button size="sm" disabled={azione === u.username}
                                iconLeft={<UserCheck size={14} />}
                                onClick={() => esegui(u.username, acceptFriendRequest)}>
                          {t("friends.accept")}
                        </Button>
                      )}
                      {stato === "FRIENDS" && (
                        <span className={styles.friendPill}><Check size={12} /> {t("friends.friends")}</span>
                      )}
                    </div>
                  }
                />
              );
            })}
          </div>
        )
      ) : null}

      {/* 2. Richieste di amicizia ricevute. */}
      {received.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>{t("friends.requestsTitle")}</h2>
          <div className={styles.grid}>
            {received.map((u) => (
              <CardUtente
                key={u.username}
                u={u}
                azioni={
                  <div className={styles.cardActions}>
                    <Button size="sm" disabled={azione === u.username}
                            iconLeft={<UserCheck size={14} />}
                            onClick={() => esegui(u.username, acceptFriendRequest)}>
                      {t("friends.accept")}
                    </Button>
                    <Button size="sm" variant="secondary" disabled={azione === u.username}
                            iconLeft={<UserX size={14} />}
                            onClick={() => esegui(u.username, removeFriend)}>
                      {t("friends.reject")}
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        </>
      )}

      {/* 3. I miei amici. */}
      <h2 className={styles.sectionTitle}>{t("friends.friendsTitle")}</h2>
      {friends.length === 0 ? (
        <p className={styles.note}>{t("friends.noFriends")}</p>
      ) : (
        <div className={styles.grid}>
          {friends.map((u) => (
            <CardUtente
              key={u.username}
              u={u}
              azioni={
                <div className={styles.cardActions}>
                  <span className={styles.friendPill}><Check size={12} /> {t("friends.friends")}</span>
                  <Button size="sm" variant="secondary" disabled={azione === u.username}
                          onClick={() => esegui(u.username, removeFriend)}>
                    {t("friends.remove")}
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
