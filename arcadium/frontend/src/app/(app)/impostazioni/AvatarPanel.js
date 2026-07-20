"use client";

// =============================================================================
// AvatarPanel — sezione "Immagine del profilo" della pagina Impostazioni
// (change request avatar).
// -----------------------------------------------------------------------------
// L'utente sceglie una tra 6 immagini predefinite (nessun upload libero: i file
// sono statici in frontend/public/avatars, serviti da Next come /avatars/*.svg).
// Il backend valida il valore contro lo stesso elenco (UserService, 400 se non
// e' uno dei preset noti).
//
// Come ProfilePanel: la selezione corrente e' DERIVATA da `user.avatarUrl` (la
// fonte di verita' e' la sessione). Salvataggio immediato al clic, poi
// refresh() del AuthProvider cosi' l'Avatar nell'header e sul profilo pubblico
// si aggiornano da soli, senza toccare Header.js ne' la pagina profilo.
// =============================================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

import { useAuth } from "@/context/AuthProvider";
import { Card } from "@/components";
import { updateMySettings } from "@/lib/api/users";
import styles from "./AvatarPanel.module.css";

// Elenco chiuso, nello stesso ordine e con gli stessi percorsi validati dal
// backend (UserService.ALLOWED_AVATAR_URLS). Le chiavi corrispondono a
// settings.avatar.names.* nei file di traduzione.
const PRESETS = [
  { key: "synthwave", url: "/avatars/synthwave.svg" },
  { key: "alieno-acido", url: "/avatars/alieno-acido.svg" },
  { key: "ghost-menta", url: "/avatars/ghost-menta.svg" },
  { key: "oni", url: "/avatars/oni.svg" },
  { key: "invader-pink", url: "/avatars/invader-pink.svg" },
  { key: "lava", url: "/avatars/lava.svg" },
];

export function AvatarPanel() {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();

  const current = user?.avatarUrl ?? null;

  const [saving, setSaving] = useState(false);
  const [avviso, setAvviso] = useState(null); // { tipo: "success"|"error", testo }

  async function scegli(url) {
    if (saving || url === current) return;
    setSaving(true);
    setAvviso(null);
    try {
      await updateMySettings({ avatarUrl: url });
      await refresh(); // rilegge /api/auth/me: user.avatarUrl aggiornato ovunque
      setAvviso({ tipo: "success", testo: t("settings.avatar.saved") });
    } catch (err) {
      setAvviso({ tipo: "error", testo: err?.message || t("settings.avatar.error") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("settings.avatar.title")}</h2>
        <p className={styles.description}>{t("settings.avatar.description")}</p>
      </div>

      <div className={styles.grid} role="radiogroup" aria-label={t("settings.avatar.title")}>
        {PRESETS.map(({ key, url }) => {
          const nome = t(`settings.avatar.names.${key}`);
          const attivo = url === current;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={attivo}
              aria-label={t("settings.avatar.optionLabel", { name: nome })}
              className={styles.option}
              data-active={attivo}
              disabled={saving}
              onClick={() => scegli(url)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className={styles.thumb} />
              {attivo && (
                <span className={styles.check} aria-hidden="true">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {avviso && (
        <p className={avviso.tipo === "error" ? styles.error : styles.success}>
          {avviso.testo}
        </p>
      )}
    </Card>
  );
}