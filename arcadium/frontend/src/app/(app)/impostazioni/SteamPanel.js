"use client";

// =============================================================================
// SteamPanel — sezione "Integrazione Steam" della pagina Impostazioni.
// -----------------------------------------------------------------------------
// Il collegamento non passa piu' dal login OpenID di Steam. Quel login dimostra
// solo CHI e' l'utente: restituisce lo SteamID e nient'altro. Per leggere
// libreria e ore giocate serve comunque una chiave della Steam Web API, che
// OpenID non rilascia — per questo il vecchio flusso mandava l'utente a fare un
// accesso che, anche riuscito, tornava indietro senza poter sincronizzare nulla.
//
// Ora il passaggio e' uno solo ed e' esplicito: l'utente genera la PROPRIA
// chiave sul sito ufficiale di Steam (istruzioni qui sotto, con il link diretto)
// e la incolla in Arcadium. Da quel momento la sync usa quella chiave.
//
// Tre stati:
//   - NON collegato   -> guida in 4 passi + modulo (profilo + chiave API);
//   - collegato       -> SteamID, "Sincronizza", "Sostituisci chiave", "Scollega";
//   - profilo privato -> avviso dopo una sync rifiutata perche' il profilo Steam
//                        dell'utente e' privato (non possiamo leggere la libreria).
//
// La chiave API e' trattata come una password: campo mascherato, niente
// autocomplete, mai rimandata indietro dal server (nemmeno mascherata) e quindi
// mai ripopolata nel modulo. Sostituirla significa inserirla di nuovo.
// =============================================================================

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { Button, Card, Input } from "@/components";
import { connectSteam, syncSteam, disconnectSteam } from "@/lib/api/integrations";
import { ApiError } from "@/lib/api/client";
import styles from "./SteamPanel.module.css";

// Pagina ufficiale di Steam da cui si genera la chiave Web API.
const STEAM_API_KEY_URL = "https://steamcommunity.com/dev/apikey";

// Link alle impostazioni privacy di Steam (per il caso "profilo privato").
const STEAM_PRIVACY_URL = "https://steamcommunity.com/my/edit/settings";

// Il backend risponde 422 alla sync quando il profilo Steam non e' leggibile
// (ApiException "error.steam.profilePrivate"). E' l'unico 422 di questo endpoint.
const HTTP_PROFILO_PRIVATO = 422;

// Logo ufficiale Steam come path SVG inline (fonte: simple-icons, CC0) — nessun
// asset immagine da caricare o mantenere, coerente con Discord/Twitch in SocialLinks.
const STEAM_ICON_PATH =
  "M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z";

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

  // Fonte di verita': l'utente della sessione. Niente stato locale duplicato.
  const steamId = user?.steamId ?? null;
  const connesso = Boolean(steamId);

  const [fase, setFase] = useState("idle"); // idle | connecting | syncing | disconnecting
  const [profiloPrivato, setProfiloPrivato] = useState(false);
  const [avviso, setAvviso] = useState(null); // { tipo: "success" | "error", testo }

  // Modulo di collegamento: sempre visibile se non collegato, a richiesta se
  // l'utente vuole sostituire la chiave gia' salvata.
  const [modificaChiave, setModificaChiave] = useState(false);
  const [profilo, setProfilo] = useState("");
  const [chiave, setChiave] = useState("");
  const [mostraChiave, setMostraChiave] = useState(false);
  const [erroriCampo, setErroriCampo] = useState({}); // { profile, apiKey } dal backend

  const occupato = fase !== "idle";
  const moduloVisibile = !connesso || modificaChiave;

  // Svuota il modulo: la chiave non deve restare in memoria piu' del necessario.
  const pulisciModulo = useCallback(() => {
    setProfilo("");
    setChiave("");
    setMostraChiave(false);
    setErroriCampo({});
  }, []);

  // Collega (o ricollega) l'account con profilo + chiave API.
  const gestisciCollega = useCallback(async () => {
    setFase("connecting");
    setAvviso(null);
    setErroriCampo({});
    try {
      // SteamConnectResponse -> { steamId, personaName }
      const res = await connectSteam({ profile: profilo.trim(), apiKey: chiave.trim() });
      await refresh(); // rilegge /api/auth/me: user.steamId ora e' valorizzato
      pulisciModulo();
      setModificaChiave(false);
      setProfiloPrivato(false);
      setAvviso({
        tipo: "success",
        testo: t("integrations.steam.connectSuccess", {
          persona: res?.personaName ?? "",
          steamId: res?.steamId ?? "",
        }),
      });
    } catch (err) {
      if (err instanceof ApiError) {
        // 400 di validazione: il backend indica quale campo e' vuoto.
        if (err.fieldErrors) setErroriCampo(err.fieldErrors);
        // Il messaggio del backend e' gia' localizzato e molto piu' utile di un
        // generico "collegamento non riuscito": chiave non valida, profilo
        // inesistente, account gia' collegato a un altro utente...
        setAvviso({ tipo: "error", testo: err.message || t("integrations.steam.connectError") });
      } else {
        setAvviso({ tipo: "error", testo: t("integrations.steam.connectError") });
      }
    } finally {
      setFase("idle");
    }
  }, [profilo, chiave, refresh, pulisciModulo, t]);

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
        setAvviso({
          tipo: "error",
          testo: err instanceof ApiError && err.message
            ? err.message
            : t("integrations.steam.syncError"),
        });
      }
    } finally {
      setFase("idle");
    }
  }, [t]);

  // Scollega l'account Steam (il backend cancella anche la chiave salvata).
  const gestisciScollega = useCallback(async () => {
    setFase("disconnecting");
    setAvviso(null);
    try {
      await disconnectSteam();
      await refresh(); // user.steamId torna null -> il pannello mostra il modulo
      pulisciModulo();
      setModificaChiave(false);
      setProfiloPrivato(false);
      setAvviso({ tipo: "success", testo: t("integrations.steam.disconnectSuccess") });
    } catch {
      setAvviso({ tipo: "error", testo: t("integrations.steam.disconnectError") });
    } finally {
      setFase("idle");
    }
  }, [t, refresh, pulisciModulo]);

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("integrations.steam.title")}</h2>
        <p className={styles.description}>{t("integrations.steam.description")}</p>
      </div>

      {/* Stato: collegato — riepilogo e azioni */}
      {connesso && (
        <div className={styles.body}>
          <p className={styles.connected}>{t("integrations.steam.connected")}</p>
          <p className={styles.steamId}>
            <span className={styles.muted}>{t("integrations.steam.steamId")}:</span> {steamId}
          </p>
          <p className={styles.muted}>{t("integrations.steam.keyStored")}</p>

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
            <Button
              variant="secondary"
              onClick={() => {
                setModificaChiave((aperto) => !aperto);
                pulisciModulo();
                setAvviso(null);
              }}
              disabled={occupato}
            >
              {modificaChiave
                ? t("integrations.steam.replaceKeyCancel")
                : t("integrations.steam.replaceKey")}
            </Button>
            <Button variant="danger" onClick={gestisciScollega} disabled={occupato}>
              {fase === "disconnecting"
                ? t("integrations.steam.disconnecting")
                : t("integrations.steam.disconnect")}
            </Button>
          </div>
        </div>
      )}

      {/* Guida + modulo: quando non si e' collegati, o quando si sostituisce la chiave */}
      {moduloVisibile && (
        <div className={styles.body}>
          {!connesso && <p className={styles.muted}>{t("integrations.steam.notConnected")}</p>}

          <div className={styles.guideBox}>
            <strong className={styles.guideTitle}>{t("integrations.steam.guide.title")}</strong>
            <p className={styles.guideIntro}>{t("integrations.steam.guide.intro")}</p>
            {/* I quattro passi restano chiavi separate (non un array) cosi' i due
                bundle si confrontano foglia per foglia come tutto il resto. */}
            <ol className={styles.steps}>
              <li>{t("integrations.steam.guide.step1")}</li>
              <li>{t("integrations.steam.guide.step2")}</li>
              <li>{t("integrations.steam.guide.step3")}</li>
              <li>{t("integrations.steam.guide.step4")}</li>
            </ol>
            <a
              href={STEAM_API_KEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.guideLink}
            >
              <SteamIcon />
              {t("integrations.steam.guide.cta")}
            </a>
            <p className={styles.guideNote}>{t("integrations.steam.guide.note")}</p>
          </div>

          <div className={styles.form}>
            <Input
              name="steam-profile"
              label={t("integrations.steam.form.profileLabel")}
              hint={t("integrations.steam.form.profileHint")}
              placeholder="https://steamcommunity.com/id/iltuonome"
              value={profilo}
              onChange={(e) => setProfilo(e.target.value)}
              error={erroriCampo.profile}
              autoComplete="off"
              spellCheck={false}
              disabled={occupato}
            />

            {/* Chiave API: trattata come una password. Il pulsante "mostra" serve
                solo a rileggere un incolla, e il campo torna mascherato appena il
                modulo si chiude. */}
            <div className={styles.secretField}>
              <Input
                className={styles.secretInput}
                name="steam-api-key"
                type={mostraChiave ? "text" : "password"}
                label={t("integrations.steam.form.keyLabel")}
                hint={t("integrations.steam.form.keyHint")}
                placeholder="••••••••••••••••••••••••••••••••"
                value={chiave}
                onChange={(e) => setChiave(e.target.value)}
                error={erroriCampo.apiKey}
                autoComplete="off"
                spellCheck={false}
                maxLength={64}
                disabled={occupato}
              />
              <Button
                variant="ghost"
                size="sm"
                className={styles.secretToggle}
                onClick={() => setMostraChiave((visibile) => !visibile)}
                aria-pressed={mostraChiave}
                disabled={occupato}
              >
                {mostraChiave
                  ? t("integrations.steam.form.hideKey")
                  : t("integrations.steam.form.showKey")}
              </Button>
            </div>

            <Button
              onClick={gestisciCollega}
              disabled={occupato || !profilo.trim() || !chiave.trim()}
              iconLeft={<SteamIcon />}
            >
              {fase === "connecting"
                ? t("integrations.steam.connecting")
                : t("integrations.steam.connect")}
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
