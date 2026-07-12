"use client";

// =============================================================================
// SteamPanel — sezione "Integrazione Steam" della pagina Impostazioni (M5-T15).
// -----------------------------------------------------------------------------
// Gestisce tre stati:
//   - NON collegato   -> bottone "Connetti Steam" (redirect al login OpenID);
//   - collegato       -> mostra lo SteamID, con "Sincronizza" e "Scollega";
//   - profilo privato -> avviso dopo una sync fallita perché il profilo Steam
//                        dell'utente è privato (non possiamo leggere la libreria).
//
// Al rientro da Steam l'URL contiene i parametri openid.*: al montaggio li
// leggiamo e chiamiamo connectSteam() per finalizzare il collegamento.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { Button, Card } from "@/components";
import {
  getSteamLoginUrl,
  connectSteam,
  syncSteam,
  disconnectSteam,
} from "@/lib/api/integrations";
import { ApiError } from "@/lib/api/client";
import styles from "./SteamPanel.module.css";

// Link alle impostazioni privacy di Steam (per il caso "profilo privato").
const STEAM_PRIVACY_URL = "https://steamcommunity.com/my/edit/settings";

// Legge i parametri openid.* dall'URL di ritorno da Steam (OpenID 2.0).
// Ritorna un oggetto { "openid.mode": "...", ... } oppure null se non stiamo
// tornando da Steam.
function leggiParametriOpenId() {
  if (typeof window === "undefined") return null;
  const query = new URLSearchParams(window.location.search);
  if (!query.has("openid.mode")) return null;
  const params = {};
  for (const [chiave, valore] of query.entries()) {
    if (chiave.startsWith("openid.")) params[chiave] = valore;
  }
  return params;
}

// Rileva se l'errore di sync è dovuto al profilo Steam privato.
// ⚠️ DA ADATTARE alla risposta REALE del backend: guarda su Swagger cosa
// risponde POST /sync con profilo privato (es. status 409/422 o un codice
// tipo "STEAM_PROFILE_PRIVATE") e correggi questa condizione.
function isProfiloPrivato(err) {
  const messaggio = (err?.message || "").toLowerCase();
  const codice = (err?.payload?.error || err?.payload?.code || "")
    .toString()
    .toLowerCase();
  return codice.includes("private") || messaggio.includes("privat");
}

export function SteamPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Stato locale. Partiamo da ciò che sa già l'utente loggato (se /api/auth/me
  // espone steamId); poi lo aggiorniamo dopo connect/disconnect.
  const [connesso, setConnesso] = useState(Boolean(user?.steamId));
  const [steamId, setSteamId] = useState(user?.steamId ?? null);
  const [fase, setFase] = useState("idle"); // idle | connecting | syncing | disconnecting
  const [profiloPrivato, setProfiloPrivato] = useState(false);
  const [avviso, setAvviso] = useState(null); // { tipo: "success"|"error", testo }

  const occupato = fase !== "idle";

  // Al ritorno dal callback Steam leggiamo l'esito da ?steam=connected|error
  // e mostriamo il messaggio giusto, poi puliamo l'URL.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const esito = query.get("steam");
    if (!esito) return;

    if (esito === "connected") {
      setConnesso(true);
      setAvviso({ tipo: "success", testo: t("integrations.steam.connectSuccess") });
    } else if (esito === "error") {
      setAvviso({ tipo: "error", testo: t("integrations.steam.connectError") });
    }

    // Ripuliamo l'URL dal parametro steam.
    window.history.replaceState({}, "", window.location.pathname);
  }, [t]);
  // Connetti: chiediamo l'URL di login e reindirizziamo il browser a Steam.
  const gestisciConnetti = useCallback(async () => {
    setFase("connecting");
    setAvviso(null);
    try {
      const res = await getSteamLoginUrl(); // atteso: { redirectUrl }
      // Difesa: se manca l'URL (es. sessione scaduta), non reindirizziamo su /undefined.
      if (!res?.redirectUrl) {
        setAvviso({ tipo: "error", testo: t("integrations.steam.connectError") });
        setFase("idle");
        return;
      }
      window.location.href = res.redirectUrl;
    } catch {
      setAvviso({ tipo: "error", testo: t("integrations.steam.connectError") });
      setFase("idle");
    }
  }, [t]);

  // Sincronizza libreria e ore di gioco.
  const gestisciSync = useCallback(async () => {
    setFase("syncing");
    setAvviso(null);
    setProfiloPrivato(false);
    try {
      const res = await syncSteam();
      // Numero di giochi importati (adatta il nome del campo alla risposta reale).
      const count = res?.imported ?? res?.count ?? 0;
      setAvviso({ tipo: "success", testo: t("integrations.steam.syncSuccess", { count }) });
    } catch (err) {
      if (err instanceof ApiError && isProfiloPrivato(err)) {
        setProfiloPrivato(true); // mostriamo l'avviso "profilo privato"
      } else {
        setAvviso({ tipo: "error", testo: t("integrations.steam.syncError") });
      }
    } finally {
      setFase("idle");
    }
  }, [t]);

  // Scollega l'account Steam.
  const gestisciScollega = useCallback(async () => {
    setFase("disconnecting");
    setAvviso(null);
    try {
      await disconnectSteam();
      setConnesso(false);
      setSteamId(null);
      setProfiloPrivato(false);
      setAvviso({ tipo: "success", testo: t("integrations.steam.disconnectSuccess") });
    } catch {
      setAvviso({ tipo: "error", testo: t("integrations.steam.disconnectError") });
    } finally {
      setFase("idle");
    }
  }, [t]);

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("integrations.steam.title")}</h2>
        <p className={styles.description}>{t("integrations.steam.description")}</p>
      </div>

      {/* Stato: NON collegato */}
      {!connesso && (
        <div className={styles.body}>
          <p className={styles.muted}>{t("integrations.steam.notConnected")}</p>
          <Button onClick={gestisciConnetti} disabled={occupato}>
            {fase === "connecting"
              ? t("integrations.steam.connecting")
              : t("integrations.steam.connect")}
          </Button>
        </div>
      )}

      {/* Stato: collegato */}
      {connesso && (
        <div className={styles.body}>
          <p className={styles.connected}>{t("integrations.steam.connected")}</p>
          {steamId && (
            <p className={styles.steamId}>
              <span className={styles.muted}>{t("integrations.steam.steamId")}:</span> {steamId}
            </p>
          )}

          {/* Avviso profilo privato */}
          {profiloPrivato && (
            <div className={styles.privateBox}>
              <strong>{t("integrations.steam.private.title")}</strong>
              <p>{t("integrations.steam.private.text")}</p>
              <a
                href={STEAM_PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.privateLink}
              >
                {t("integrations.steam.private.cta")}
              </a>
            </div>
          )}

          <div className={styles.actions}>
            <Button onClick={gestisciSync} disabled={occupato}>
              {fase === "syncing"
                ? t("integrations.steam.syncing")
                : t("integrations.steam.sync")}
            </Button>
            <Button variant="danger" onClick={gestisciScollega} disabled={occupato}>
              {fase === "disconnecting"
                ? t("integrations.steam.disconnecting")
                : t("integrations.steam.disconnect")}
            </Button>
          </div>
        </div>
      )}

      {/* Messaggio di esito (successo/errore) */}
      {avviso && (
        <p className={avviso.tipo === "error" ? styles.error : styles.success}>
          {avviso.testo}
        </p>
      )}
    </Card>
  );
}