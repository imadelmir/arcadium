"use client";

// =============================================================================
// UsernamePanel — sezione "Nome utente" della pagina Impostazioni (V16).
// -----------------------------------------------------------------------------
// Consente di cambiare il proprio username, ma al massimo una volta ogni 2 mesi.
// Il cooldown è applicato dal backend, che invia usernameChangeAllowedAt quando
// il cambio non è ancora consentito. Poiché il subject del JWT è lo username, il
// cambio passa da AuthProvider.changeUsername, che sostituisce il token e
// aggiorna l'utente in sessione. Sul profilo pubblico resterà poi visibile il
// nome precedente ("potresti conoscerlo come @vecchio").
// =============================================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/AuthProvider";
import { Card, Input, Button } from "@/components";
import { ApiError } from "@/lib/api/client";
import styles from "./UsernamePanel.module.css";

export function UsernamePanel() {
  const { t, i18n } = useTranslation();
  const { user, changeUsername } = useAuth();

  // Cooldown: il backend invia usernameChangeAllowedAt (istante di sblocco) SOLO
  // se il cambio non è ancora consentito; assente = si può cambiare ora.
  const allowedAt = user?.usernameChangeAllowedAt
    ? new Date(user.usernameChangeAllowedAt)
    : null;
  const isLocked = allowedAt !== null;

  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [avviso, setAvviso] = useState(null); // { tipo: "success"|"error", testo }

  const trimmed = value.trim();
  const canSave = !saving && !isLocked && trimmed.length > 0 && trimmed !== user?.username;

  async function salva() {
    if (!canSave) return;
    setSaving(true);
    setAvviso(null);
    try {
      await changeUsername(trimmed);
      setValue("");
      setAvviso({ tipo: "success", testo: t("settings.username.saved") });
    } catch (err) {
      const testo = err instanceof ApiError && err.message
        ? err.message
        : t("settings.username.error");
      setAvviso({ tipo: "error", testo });
    } finally {
      setSaving(false);
    }
  }

  const lockedLabel = isLocked
    ? t("settings.username.locked", {
        date: new Intl.DateTimeFormat(i18n.language, { dateStyle: "long" }).format(allowedAt),
      })
    : null;

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("settings.username.title")}</h2>
        <p className={styles.description}>{t("settings.username.description")}</p>
      </div>

      <p className={styles.current}>
        {t("settings.username.current")} <strong>@{user?.username}</strong>
      </p>

      <div className={styles.form}>
        <Input
          name="newUsername"
          type="text"
          label={t("settings.username.newLabel")}
          placeholder={t("settings.username.placeholder")}
          value={value}
          maxLength={50}
          disabled={saving || isLocked}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button onClick={salva} disabled={!canSave}>
          {t("settings.username.save")}
        </Button>
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
