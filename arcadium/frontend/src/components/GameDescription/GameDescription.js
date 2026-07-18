"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateText, detectLang } from "@/lib/translate";
import styles from "./GameDescription.module.css";

// GameDescription
// -----------------------------------------------------------------------------
// Mostra la descrizione del gioco (aboutTheGame), che dal dataset Steam arriva
// nella lingua ORIGINALE (inglese, ma anche cinese/giapponese/coreano).
//
// Comportamento:
//   - di default mostra la TRADUZIONE nella lingua dell'interfaccia (IT o EN);
//   - cambiando lingua col language switcher, ri-traduce verso la nuova lingua;
//   - "Mostra originale" mostra il testo grezzo nella sua lingua vera;
//   - la scelta (tradotto/originale) viene ricordata per i giochi successivi;
//   - ogni traduzione è messa in CACHE per gioco+lingua: la prima volta chiama
//     l'API, poi è istantanea;
//   - se una lingua è già quella dell'interfaccia, niente pulsante: è già a posto.

// Preferenza globale: "trans" (tradotto) oppure "orig" (originale). Default trans.
const PREF_KEY = "arcadium:descMode";
// Cache della traduzione di un gioco verso una lingua specifica (it/en).
// La versione "v2" nella chiave INVALIDA le vecchie voci sbagliate salvate
// dalla prima versione del componente (che su un gioco cinese salvava il testo
// cinese sotto la chiave italiana): con v2 quelle voci vengono ignorate.
const cacheKey = (id, lang) => `arcadium:desc:v2:${id}:${lang}`;

export function GameDescription({ text, gameId }) {
  const { t, i18n } = useTranslation();

  // Lingua dell'interfaccia ridotta a "it" o "en" (come nel resto dell'app).
  const uiLang = (i18n.language || "it").toLowerCase().startsWith("en") ? "en" : "it";
  // Lingua di partenza del testo, riconosciuta una volta sola.
  const sourceLang = useMemo(() => detectLang(text), [text]);
  // C'è qualcosa da tradurre solo se la lingua originale è diversa dalla UI.
  const needsTranslation = sourceLang !== uiLang;

  // Modalità: "translated" (lingua UI) oppure "original".
  const [mode, setMode] = useState("translated");
  // Traduzione corrente (per la lingua UI attuale) e a quale lingua appartiene.
  const [translated, setTranslated] = useState(null);
  const translatedForRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error

  // Modalità iniziale dalla preferenza salvata (localStorage è solo lato client).
  useEffect(() => {
    let pref = null;
    try {
      pref = localStorage.getItem(PREF_KEY);
    } catch {
      pref = null;
    }
    setMode(pref === "orig" ? "original" : "translated");
  }, []);

  // Se cambia la lingua UI (o il testo), la vecchia traduzione non vale più.
  useEffect(() => {
    setTranslated(null);
    translatedForRef.current = null;
  }, [uiLang, text]);

  // Carica la traduzione quando serve (modalità tradotta + lingua diversa).
  useEffect(() => {
    if (mode !== "translated" || !needsTranslation || !text) return;
    if (translated && translatedForRef.current === uiLang) return;

    let attivo = true;

    // 1) Cache locale per questo gioco e questa lingua.
    try {
      const cached = localStorage.getItem(cacheKey(gameId, uiLang));
      if (cached) {
        setTranslated(cached);
        translatedForRef.current = uiLang;
        return;
      }
    } catch {
      /* localStorage non disponibile: si procede con l'API */
    }

    // 2) Traduzione via API (riconoscendo la lingua di partenza), poi in cache.
    setStatus("loading");
    translateText(text, { from: sourceLang, to: uiLang })
      .then((out) => {
        if (!attivo) return;
        setTranslated(out);
        translatedForRef.current = uiLang;
        setStatus("idle");
        try {
          localStorage.setItem(cacheKey(gameId, uiLang), out);
        } catch {
          /* quota piena o non disponibile: niente cache, pazienza */
        }
      })
      .catch(() => {
        if (!attivo) return;
        // Fallback pulito: mostra l'originale e segnala l'errore.
        setStatus("error");
        setMode("original");
      });

    return () => {
      attivo = false;
    };
  }, [mode, needsTranslation, text, uiLang, sourceLang, gameId, translated]);

  // Cambia modalità e ricorda la preferenza per i prossimi giochi.
  function toggle() {
    const next = mode === "translated" ? "original" : "translated";
    setMode(next);
    setStatus("idle");
    try {
      localStorage.setItem(PREF_KEY, next === "original" ? "orig" : "trans");
    } catch {
      /* ignorato */
    }
  }

  // Testo da mostrare:
  //   - originale -> testo grezzo (lingua di partenza);
  //   - tradotto  -> traduzione se pronta, altrimenti l'originale come segnaposto
  //     mentre carica (o direttamente l'originale se non serve tradurre).
  const showingTranslated =
    mode === "translated" && needsTranslation && Boolean(translated);
  const body = showingTranslated ? translated : text;

  return (
    <>
      {/* Il pulsante compare solo se c'è davvero qualcosa da tradurre. */}
      {needsTranslation && (
        <div className={styles.bar}>
          <button
            type="button"
            className={styles.toggle}
            onClick={toggle}
            disabled={status === "loading"}
          >
            {status === "loading"
              ? t("gameDetail.translating")
              : mode === "translated"
              ? t("gameDetail.showOriginal")
              : t("gameDetail.showTranslated")}
          </button>

          {showingTranslated && (
            <span className={styles.note}>{t("gameDetail.autoTranslated")}</span>
          )}
          {status === "error" && (
            <span className={styles.error}>{t("gameDetail.translateError")}</span>
          )}
        </div>
      )}

      <p className={styles.about}>{body}</p>
    </>
  );
}