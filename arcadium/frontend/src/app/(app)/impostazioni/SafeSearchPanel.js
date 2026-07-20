"use client";

// =============================================================================
// SafeSearchPanel — sezione "Safe search" della pagina Impostazioni
// (change request safe search, V18).
// -----------------------------------------------------------------------------
// Interruttore unico: acceso, il Negozio non mostra i titoli con contenuto
// sessuale esplicito, nudita' o classificati 18+; spento, il catalogo e' intero.
//
// Colore ROSSO quando e' ATTIVO (richiesta esplicita del cliente). E' l'inverso
// della convenzione degli altri interruttori dell'app, dove il violetto del tema
// segnala "acceso": qui il rosso non vuol dire errore ma "filtro che sta
// bloccando qualcosa", come il pallino di registrazione. Per non lasciare il
// significato al solo colore — che chi non distingue i rossi non coglie — lo
// stato e' scritto anche a parole sotto l'interruttore.
//
// Fonte di verita': la sessione (user.safeSearch), come per privacy e avatar.
// Salvataggio immediato al clic, poi refresh() del AuthProvider: il Negozio
// legge lo stesso valore e si riallinea da solo alla prossima ricerca.
//
// Il filtro VERO e' applicato dal backend, che legge la colonna dell'utente
// autenticato: questo pannello cambia la preferenza, non il filtro. Spegnere
// l'interruttore dai DevTools non mostra nulla di piu'.
// =============================================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, ShieldOff } from "lucide-react";

import { useAuth } from "@/context/AuthProvider";
import { Card } from "@/components";
import { updateMySettings } from "@/lib/api/users";
import styles from "./SafeSearchPanel.module.css";

export function SafeSearchPanel() {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();

  // Colonna NOT NULL DEFAULT TRUE lato DB: l'unico modo di non avere il valore
  // e' non avere ancora la sessione, e in quel caso il default e' "attivo".
  const attivo = user?.safeSearch !== false;

  const [saving, setSaving] = useState(false);
  const [avviso, setAvviso] = useState(null); // { tipo: "success"|"error", testo }

  async function inverti() {
    if (saving) return;
    const nuovo = !attivo;
    setSaving(true);
    setAvviso(null);
    try {
      await updateMySettings({ safeSearch: nuovo });
      await refresh(); // rilegge /api/auth/me: user.safeSearch aggiornato ovunque
      setAvviso({ tipo: "success", testo: t("settings.safeSearch.saved") });
    } catch (err) {
      setAvviso({ tipo: "error", testo: err?.message || t("settings.safeSearch.error") });
    } finally {
      setSaving(false);
    }
  }

  const Icona = attivo ? ShieldCheck : ShieldOff;

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{t("settings.safeSearch.title")}</h2>
          <p className={styles.description}>{t("settings.safeSearch.description")}</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={attivo}
          aria-label={t("settings.safeSearch.enableAria")}
          className={styles.switch}
          data-on={attivo}
          disabled={saving}
          onClick={inverti}
        >
          <span className={styles.knob} />
        </button>
      </div>

      {/* Stato a parole: il colore da solo non basta come informazione. */}
      <div className={styles.state} data-on={attivo}>
        <Icona size={18} aria-hidden="true" className={styles.stateIcon} />
        <div>
          <p className={styles.stateLabel}>
            {t(attivo ? "settings.safeSearch.on" : "settings.safeSearch.off")}
          </p>
          <p className={styles.stateHint}>
            {t(attivo ? "settings.safeSearch.onHint" : "settings.safeSearch.offHint")}
          </p>
        </div>
      </div>

      {avviso && (
        <p className={avviso.tipo === "error" ? styles.error : styles.success}>
          {avviso.testo}
        </p>
      )}
    </Card>
  );
}
