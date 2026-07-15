"use client";

// =============================================================================
// ProfilePanel — sezione "Privacy del profilo" della pagina Impostazioni
// (change request privacy).
// -----------------------------------------------------------------------------
// Consente di rendere il proprio profilo PUBBLICO o PRIVATO:
//   - pubblico -> l'utente e' cercabile e puo' cercare gli altri;
//   - privato  -> non e' cercabile e non puo' cercare nessuno.
//
// La visibilita' e' DERIVATA da `user.profilePublic` (la fonte di verita' e'
// la sessione, come per SteamPanel): dopo il salvataggio si chiama refresh()
// del AuthProvider, cosi' l'interfaccia (Community compresa) si allinea da sola.
// Salvataggio immediato al clic sull'opzione, senza pulsante "Salva".
// =============================================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Lock } from "lucide-react";

import { useAuth } from "@/context/AuthProvider";
import { Card } from "@/components";
import { updateMySettings } from "@/lib/api/users";
import styles from "./ProfilePanel.module.css";

export function ProfilePanel() {
  const { t, i18n } = useTranslation();
  const { user, refresh } = useAuth();

  // Fonte di verita': la sessione. In assenza di dato si assume pubblico.
  const isPublic = user?.profilePublic ?? true;

  // Cooldown 48h (change request): il backend invia profileVisibilityLockedUntil
  // (istante di sblocco) SOLO se il cooldown e' ancora attivo, null se scaduto.
  // Quindi la presenza del campo = ancora in cooldown (nessun confronto col
  // clock lato render, che sarebbe impuro).
  const lockedUntil = user?.profileVisibilityLockedUntil
    ? new Date(user.profileVisibilityLockedUntil)
    : null;
  const isLocked = lockedUntil !== null;

  const [saving, setSaving] = useState(false);
  const [avviso, setAvviso] = useState(null); // { tipo: "success"|"error", testo }

  async function setVisibility(next) {
    if (saving || isLocked || next === isPublic) return;
    setSaving(true);
    setAvviso(null);
    try {
      await updateMySettings({ profilePublic: next });
      await refresh(); // rilegge /api/auth/me: user.profilePublic + lockedUntil aggiornati
      setAvviso({ tipo: "success", testo: t("settings.privacy.saved") });
    } catch (err) {
      // Messaggio del server se presente (es. 429 cooldown), altrimenti generico.
      setAvviso({ tipo: "error", testo: err?.message || t("settings.privacy.error") });
    } finally {
      setSaving(false);
    }
  }

  const lockedLabel = isLocked
    ? t("settings.privacy.locked", {
        time: new Intl.DateTimeFormat(i18n.language, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(lockedUntil),
      })
    : null;

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("settings.privacy.title")}</h2>
        <p className={styles.description}>{t("settings.privacy.description")}</p>
      </div>

      <div className={styles.options} role="radiogroup" aria-label={t("settings.privacy.title")}>
        <button
          type="button"
          role="radio"
          aria-checked={isPublic}
          className={styles.option}
          data-active={isPublic}
          disabled={saving || isLocked}
          onClick={() => setVisibility(true)}
        >
          <Globe size={18} aria-hidden="true" />
          <span className={styles.optionLabel}>{t("settings.privacy.public")}</span>
          <span className={styles.optionHint}>{t("settings.privacy.publicHint")}</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={!isPublic}
          className={styles.option}
          data-active={!isPublic}
          disabled={saving || isLocked}
          onClick={() => setVisibility(false)}
        >
          <Lock size={18} aria-hidden="true" />
          <span className={styles.optionLabel}>{t("settings.privacy.private")}</span>
          <span className={styles.optionHint}>{t("settings.privacy.privateHint")}</span>
        </button>
      </div>

      {lockedLabel && <p className={styles.locked}>{lockedLabel}</p>}

      {avviso && (
        <p className={avviso.tipo === "error" ? styles.error : styles.success}>
          {avviso.testo}
        </p>
      )}
    </Card>
  );
}
