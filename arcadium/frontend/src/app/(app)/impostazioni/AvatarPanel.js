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
// Change request avatar predefinito: alle 6 immagini si aggiunge una settima
// casella, "Predefinito", che RIMUOVE l'immagine e riporta all'avatar generato
// dall'iniziale dello username. E' una casella nella stessa griglia e non un
// pulsante "Rimuovi" a parte perche' non e' un'azione distruttiva ma una scelta
// come le altre: si vede subito com'e' fatta e la si confronta con le immagini.
// A protocollo si traduce in avatarUrl: "" (stringa vuota) — null significa gia'
// "non toccare il campo" nella PATCH parziale.
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
import { Card, Avatar } from "@/components";
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
  const nessunaImmagine = !current;

  const [saving, setSaving] = useState(false);
  const [avviso, setAvviso] = useState(null); // { tipo: "success"|"error", testo }

  // url: percorso di un preset, oppure "" per tornare all'avatar predefinito.
  async function scegli(url) {
    // Confronto con "" normalizzato: current e' null quando non c'e' immagine,
    // quindi senza questo un secondo clic su "Predefinito" rifarebbe la chiamata.
    if (saving || url === (current ?? "")) return;
    setSaving(true);
    setAvviso(null);
    try {
      await updateMySettings({ avatarUrl: url });
      await refresh(); // rilegge /api/auth/me: user.avatarUrl aggiornato ovunque
      setAvviso({
        tipo: "success",
        testo: t(url ? "settings.avatar.saved" : "settings.avatar.removed"),
      });
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
        {/* Casella "Predefinito": rimuove l'immagine. L'anteprima e' lo stesso
            componente Avatar usato nell'header, senza src — quindi mostra
            esattamente cio' che si otterra' scegliendola, non un'imitazione. */}
        <button
          type="button"
          role="radio"
          aria-checked={nessunaImmagine}
          aria-label={t("settings.avatar.optionLabel", { name: t("settings.avatar.default") })}
          className={styles.option}
          data-active={nessunaImmagine}
          disabled={saving}
          onClick={() => scegli("")}
        >
          <Avatar name={user?.username || ""} size="lg" className={styles.defaultThumb} />
          {nessunaImmagine && (
            <span className={styles.check} aria-hidden="true">
              <Check size={14} strokeWidth={3} />
            </span>
          )}
        </button>

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

      {/* Etichetta della casella "Predefinito": senza, l'unica differenza fra
          quella e le altre sarebbe l'aspetto dell'anteprima. */}
      <p className={styles.hint}>{t("settings.avatar.defaultHint")}</p>

      {avviso && (
        <p className={avviso.tipo === "error" ? styles.error : styles.success}>
          {avviso.testo}
        </p>
      )}
    </Card>
  );
}