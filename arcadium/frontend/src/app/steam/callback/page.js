"use client";

// =============================================================================
// Callback Steam (/steam/callback) — M5-T15.
// -----------------------------------------------------------------------------
// Steam, dopo il login OpenID, rimanda l'utente qui con i parametri openid.*
// nell'URL. Questa pagina li legge, li invia a POST /api/integrations/steam/
// connect per finalizzare il collegamento, poi riporta l'utente su Impostazioni
// con un esito (?steam=connected oppure ?steam=error).
// =============================================================================

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { connectSteam } from "@/lib/api/integrations";
import { Spinner } from "@/components";

export default function SteamCallbackPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [errore, setErrore] = useState(false);

  // Evita che la connect parta due volte (React monta i componenti due volte
  // in sviluppo con StrictMode).
  const giaEseguito = useRef(false);

  useEffect(() => {
    if (giaEseguito.current) return;
    giaEseguito.current = true;

    // Raccoglie tutti i parametri openid.* dall'URL di ritorno da Steam.
    const query = new URLSearchParams(window.location.search);
    const params = {};
    for (const [chiave, valore] of query.entries()) {
      if (chiave.startsWith("openid.")) params[chiave] = valore;
    }

    // Se l'utente ha annullato o mancano i parametri: torniamo indietro con errore.
    if (params["openid.mode"] === "cancel" || Object.keys(params).length === 0) {
      router.replace("/impostazioni?steam=error");
      return;
    }

    (async () => {
      try {
        // Inviamo i parametri openid.* al backend (accetta una Map).
        await connectSteam(params);
        router.replace("/impostazioni?steam=connected");
      } catch {
        setErrore(true);
        // Piccola pausa così l'utente legge il messaggio, poi torna indietro.
        setTimeout(() => router.replace("/impostazioni?steam=error"), 1500);
      }
    })();
  }, [router]);

  // Schermata di attesa mentre finalizziamo il collegamento.
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        textAlign: "center",
      }}
    >
      <Spinner />
      <p>
        {errore
          ? t("integrations.steam.connectError")
          : t("integrations.steam.connecting")}
      </p>
    </div>
  );
}