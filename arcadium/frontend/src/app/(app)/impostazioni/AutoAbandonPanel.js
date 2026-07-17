"use client";

// =============================================================================
// AutoAbandonPanel — sezione "Auto-abbandono" della pagina Impostazioni
// (change request, feature M6).
// -----------------------------------------------------------------------------
// L'utente sceglie dopo quanti mesi di inattivita' un gioco "In corso" passa
// automaticamente ad "Abbandonato": barra a 3 puntini (1 / 3 / 6 mesi) + toggle
// on/off (la funzione e' opt-in, spenta di default).
//
// Fonte di verita': la sessione (user.abandonAfterMonths, null = spento), come
// per privacy e Steam. Salvataggio immediato al clic; poi refresh() del
// AuthProvider per riallineare l'interfaccia. Il backend mappa 0 -> NULL (spento).
// =============================================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/AuthProvider";
import { Card } from "@/components";
import { updateMySettings } from "@/lib/api/users";
import styles from "./AutoAbandonPanel.module.css";

const STEPS = [1, 3, 6]; // mesi, in ordine
const DEFAULT_ON = 3;    // valore preselezionato quando si attiva

export function AutoAbandonPanel() {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();

  const current = user?.abandonAfterMonths ?? null; // null = spento
  const enabled = current !== null;

  const [saving, setSaving] = useState(false);
  const [avviso, setAvviso] = useState(null); // { tipo, testo }

  // value: 0 = spegni, oppure 1/3/6 = mesi
  async function save(value) {
    if (saving || value === (current ?? 0)) return;
    setSaving(true);
    setAvviso(null);
    try {
      await updateMySettings({ abandonAfterMonths: value });
      await refresh(); // rilegge /api/auth/me: user.abandonAfterMonths aggiornato
      setAvviso({ tipo: "success", testo: t("settings.autoAbandon.saved") });
    } catch (err) {
      setAvviso({ tipo: "error", testo: err?.message || t("settings.autoAbandon.error") });
    } finally {
      setSaving(false);
    }
  }

  function toggle() {
    save(enabled ? 0 : DEFAULT_ON);
  }

  const labels = {
    1: t("settings.autoAbandon.month1"),
    3: t("settings.autoAbandon.month3"),
    6: t("settings.autoAbandon.month6"),
  };

  // Riempimento della barra fino al puntino selezionato.
  const activeIndex = enabled ? STEPS.indexOf(current) : -1;
  const fillPct = activeIndex <= 0 ? 0 : (activeIndex / (STEPS.length - 1)) * 100;

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{t("settings.autoAbandon.title")}</h2>
          <p className={styles.description}>{t("settings.autoAbandon.description")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t("settings.autoAbandon.enableAria")}
          className={styles.switch}
          data-on={enabled}
          disabled={saving}
          onClick={toggle}
        >
          <span className={styles.knob} />
        </button>
      </div>

      <div className={styles.barWrap} data-disabled={!enabled}>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${fillPct}%` }} />
          {STEPS.map((m) => (
            <button
              key={m}
              type="button"
              className={styles.dot}
              data-active={enabled && current === m}
              aria-label={labels[m]}
              disabled={saving || !enabled}
              onClick={() => save(m)}
            >
              <span className={styles.dotInner} />
            </button>
          ))}
        </div>
        <div className={styles.labels}>
          {STEPS.map((m) => (
            <span
              key={m}
              className={styles.stepLabel}
              data-active={enabled && current === m}
            >
              {labels[m]}
            </span>
          ))}
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
