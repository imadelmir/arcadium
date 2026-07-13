"use client";

// Pagina Community (M5-T13) — lista utenti + ricerca.
// Ogni card porta alla pagina profilo dell'utente (/profilo/[username]).

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Search, Lock } from "lucide-react";

import { Input, Avatar, Spinner } from "@/components";
import { searchUsers } from "@/lib/api/users";
import styles from "./community.module.css";

export default function CommunityPage() {
  const { t } = useTranslation();

  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Debounce della ricerca (aspetta che l'utente smetta di digitare).
  const [qDebounced, setQDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setQDebounced(q), 350);
    return () => clearTimeout(id);
  }, [q]);

  // Carica gli utenti quando cambia la ricerca.
  useEffect(() => {
    let attivo = true;
    // M6-T4: il caricamento vive dentro una funzione asincrona. L'effetto rigira
    // a ogni cambio dipendenze e lo spinner deve ricomparire, quindi il setState
    // serve: qui non e' piu' nel corpo sincrono dell'effetto.
    const carica = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await searchUsers({ q: qDebounced.trim() || undefined, page: 0, size: 40 });
        if (attivo) setUsers(res.content);
      } catch {
        if (attivo) setError(true);
      } finally {
        if (attivo) setLoading(false);
      }
    };
    carica();
    return () => { attivo = false; };
  }, [qDebounced]);

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t("nav.community")}</h1>
        <p className={styles.subtitle}>{t("community.subtitle")}</p>
      </header>

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

      {loading ? (
        <div className={styles.state}><Spinner size="lg" /></div>
      ) : error ? (
        <div className={styles.state}>{t("errors.network")}</div>
      ) : users.length === 0 ? (
        <div className={styles.state}>{t("community.noResults")}</div>
      ) : (
        <div className={styles.grid}>
          {users.map((u) => {
            const nome = u.displayName || u.username;
            return (
              <Link
                key={u.username}
                href={`/profilo/${encodeURIComponent(u.username)}`}
                className={styles.card}
              >
                <Avatar name={nome} src={u.avatarUrl} size="lg" />
                <div className={styles.info}>
                  <div className={styles.name}>{nome}</div>
                  <div className={styles.meta}>
                    {u.profilePublic ? (
                      <span>@{u.username}</span>
                    ) : (
                      <span className={styles.private}>
                        <Lock size={11} /> {t("community.privateProfile")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}