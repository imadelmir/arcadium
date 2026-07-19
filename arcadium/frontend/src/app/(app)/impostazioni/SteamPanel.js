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
import { useSearchParams } from "next/navigation";
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

// Logo ufficiale Steam come path SVG inline (fonte: simple-icons, CC0) — nessun
// asset immagine da caricare o mantenere, coerente con Discord/Twitch in SocialLinks.
const STEAM_ICON_PATH =
  "M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z";

// Icona Steam da usare dentro il bottone "Connetti Steam" (iconLeft), piccola
// e coerente con l'SVG inline di Discord/Twitch in SocialLinks.
function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true" focusable="false">
      <path d={STEAM_ICON_PATH} fill="currentColor" />
    </svg>
  );
}

export function SteamPanel() {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();

  // Esito del ritorno da Steam (?steam=connected|error). Si legge durante il
  // render — non dentro un effetto che scrive stato (M6-T4).
  const searchParams = useSearchParams();
  const esitoSteam = searchParams.get("steam");

  // Fonte di verità: l'utente della sessione. Niente stato locale duplicato.
  const steamId = user?.steamId ?? null;
  const connesso = Boolean(steamId);

  const [fase, setFase] = useState("idle"); // idle | connecting | syncing | disconnecting
  const [profiloPrivato, setProfiloPrivato] = useState(false);
  // Messaggio prodotto dalle azioni locali (sync, scollega). Se è null vale
  // quello derivato dal ritorno da Steam, qui sotto.
  const [avvisoLocale, setAvvisoLocale] = useState(null);

  const occupato = fase !== "idle";

  const avvisoRitorno =
    esitoSteam === "connected"
      ? { tipo: "success", testo: t("integrations.steam.connectSuccess") }
      : esitoSteam === "error"
        ? { tipo: "error", testo: t("integrations.steam.connectError") }
        : null;

  const avviso = avvisoLocale ?? avvisoRitorno;

  // Al ritorno dal callback Steam: ricarichiamo l'utente (così compare lo
  // SteamID) e togliamo il parametro dall'URL. Nessuno stato locale toccato qui.
  useEffect(() => {
    if (!esitoSteam) return;
    if (esitoSteam === "connected") {
      refresh(); // rilegge /api/auth/me: user.steamId ora è valorizzato
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [esitoSteam, refresh]);

  // Connetti: chiediamo l'URL di login e reindirizziamo il browser a Steam.
  const gestisciConnetti = useCallback(async () => {
    setFase("connecting");
    setAvvisoLocale(null);
    try {
      const res = await getSteamLoginUrl(); // SteamLoginUrlResponse -> { redirectUrl }
      // Difesa: se manca l'URL (es. sessione scaduta), non reindirizziamo su /undefined.
      if (!res?.redirectUrl) {
        setAvvisoLocale({ tipo: "error", testo: t("integrations.steam.connectError") });
        setFase("idle");
        return;
      }
      window.location.href = res.redirectUrl;
    } catch {
      setAvvisoLocale({ tipo: "error", testo: t("integrations.steam.connectError") });
      setFase("idle");
    }
  }, [t]);

  // Sincronizza libreria e ore di gioco.
  const gestisciSync = useCallback(async () => {
    setFase("syncing");
    setAvvisoLocale(null);
    setProfiloPrivato(false);
    try {
      // SteamSyncResponse -> { ownedOnSteam, added, updated, skipped }
      const res = await syncSteam();
      setAvvisoLocale({
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
        setAvvisoLocale({ tipo: "error", testo: t("integrations.steam.syncError") });
      }
    } finally {
      setFase("idle");
    }
  }, [t]);

  // Scollega l'account Steam.
  const gestisciScollega = useCallback(async () => {
    setFase("disconnecting");
    setAvvisoLocale(null);
    try {
      await disconnectSteam();
      await refresh(); // user.steamId torna null -> il pannello mostra "Connetti"
      setProfiloPrivato(false);
      setAvvisoLocale({ tipo: "success", testo: t("integrations.steam.disconnectSuccess") });
    } catch {
      setAvvisoLocale({ tipo: "error", testo: t("integrations.steam.disconnectError") });
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
          <Button onClick={gestisciConnetti} disabled={occupato} iconLeft={<SteamIcon />}>
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