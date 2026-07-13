"use client";

// =============================================================================
// SteamPanel — sezione "Integrazione Steam" della pagina Impostazioni (M5-T15).
// -----------------------------------------------------------------------------
// Gestisce tre stati:
//   - NON collegato   -> bottone "Connetti Steam" (redirect al login OpenID);
//   - collegato       -> mostra lo SteamID, con "Sincronizza" e "Scollega";
//   - profilo privato -> avviso dopo una sync rifiutata perché il profilo Steam
//                        dell'utente è privato (non possiamo leggere la libreria).
//
// M6-T4 — tre correzioni:
//   1. Lo stato "collegato" NON è più una copia locale fatta al primo render
//      (che restava a false dopo un refresh, perché l'utente arriva in modo
//      asincrono e /api/auth/me non esponeva steamId): ora è DERIVATO da
//      `user.steamId`, che il backend restituisce. Dopo connect/disconnect si
//      chiama refresh() del AuthProvider e l'interfaccia si allinea da sola.
//   2. Il messaggio di sync usa i campi REALI di SteamSyncResponse
//      (ownedOnSteam, added, updated, skipped): prima leggeva `imported`/`count`,
//      che non esistono, e ogni sincronizzazione riuscita diceva "0 giochi".
//   3. Il profilo privato si riconosce dal 422 del backend (Steam risponde 200
//      con libreria vuota: la distinzione la fa il server, vedi SteamClient),
//      non più indovinando dal testo del messaggio.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { Button, Card } from "@/components";
import {
  getSteamLoginUrl,
  syncSteam,
  disconnectSteam,
} from "@/lib/api/integrations";
import { ApiError } from "@/lib/api/client";
import styles from "./SteamPanel.module.css";

// Link alle impostazioni privacy di Steam (per il caso "profilo privato").
const STEAM_PRIVACY_URL = "https://steamcommunity.com/my/edit/settings";

// Il backend risponde 422 alla sync quando il profilo Steam non è leggibile
// (ApiException "error.steam.profilePrivate"). È l'unico 422 di questo endpoint.
const HTTP_PROFILO_PRIVATO = 422;

export function SteamPanel() {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();

  // Fonte di verità: l'utente della sessione. Niente stato locale duplicato.
  const steamId = user?.steamId ?? null;
  const connesso = Boolean(steamId);

  const [fase, setFase] = useState("idle"); // idle | connecting | syncing | disconnecting
  const [profiloPrivato, setProfiloPrivato] = useState(false);
  const [avviso, setAvviso] = useState(null); // { tipo: "success"|"error", testo }

  const occupato = fase !== "idle";

  // Al ritorno dal callback Steam leggiamo l'esito da ?steam=connected|error,
  // ricarichiamo l'utente (così compare lo SteamID) e puliamo l'URL.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const esito = query.get("steam");
    if (!esito) return;

    if (esito === "connected") {
      setAvviso({ tipo: "success", testo: t("integrations.steam.connectSuccess") });
      refresh(); // rilegge /api/auth/me: user.steamId ora è valorizzato
    } else if (esito === "error") {
      setAvviso({ tipo: "error", testo: t("integrations.steam.connectError") });
    }

    // Ripuliamo l'URL dal parametro steam.
    window.history.replaceState({}, "", window.location.pathname);
  }, [t, refresh]);

  // Connetti: chiediamo l'URL di login e reindirizziamo il browser a Steam.
  const gestisciConnetti = useCallback(async () => {
    setFase("connecting");
    setAvviso(null);
    try {
      const res = await getSteamLoginUrl(); // SteamLoginUrlResponse -> { redirectUrl }
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
      // SteamSyncResponse -> { ownedOnSteam, added, updated, skipped }
      const res = await syncSteam();
      setAvviso({
        tipo: "success",
        testo: t("integrations.steam.syncSuccess", {
          owned: res?.ownedOnSteam ?? 0,
          added: res?.added ?? 0,
          updated: res?.updated ?? 0,
          skipped: res?.skipped ?? 0,
        }),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === HTTP_PROFILO_PRIVATO) {
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
      await refresh(); // user.steamId torna null -> il pannello mostra "Connetti"
      setProfiloPrivato(false);
      setAvviso({ tipo: "success", testo: t("integrations.steam.disconnectSuccess") });
    } catch {
      setAvviso({ tipo: "error", testo: t("integrations.steam.disconnectError") });
    } finally {
      setFase("idle");
    }
  }, [t, refresh]);

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
          <p className={styles.steamId}>
            <span className={styles.muted}>{t("integrations.steam.steamId")}:</span> {steamId}
          </p>

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
