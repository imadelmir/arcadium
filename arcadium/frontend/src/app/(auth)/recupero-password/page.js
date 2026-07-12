"use client";

// Pagina "Password dimenticata" — passo 1 del recupero password (M4-T17)
// -----------------------------------------------------------------------------
// L'utente inserisce la propria email e riceve (via link) le istruzioni per
// reimpostare la password. Il backend risponde SEMPRE allo stesso modo, esista
// o no l'email: qui mostriamo quindi sempre lo stesso messaggio di conferma,
// senza rivelare se l'indirizzo è registrato.
//
// In sviluppo, se il backend ha il flag expose-token attivo, la risposta porta
// un `devToken`: lo trasformiamo in un link cliccabile verso la pagina di
// reimpostazione, così si può provare l'intero flusso senza un server email.

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/Input/Input";
import { Button } from "@/components/Button/Button";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import styles from "../auth-card.module.css";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});       // messaggi per singolo campo
  const [formError, setFormError] = useState("");  // banner di errore in cima
  const [done, setDone] = useState(false);         // richiesta inviata: mostra conferma
  const [devLink, setDevLink] = useState("");      // solo dev: link diretto al reset
  const [submitting, setSubmitting] = useState(false);

  // Validazione minima lato client: email presente e formalmente valida.
  function validate() {
    const next = {};
    if (!email.trim()) next.email = t("auth.validation.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = t("auth.validation.invalidEmail");
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      // In dev, se presente il token, costruiamo un link diretto alla pagina di reset.
      if (res?.devToken) {
        setDevLink(`/reimposta-password?token=${encodeURIComponent(res.devToken)}`);
      }
      setDone(true); // messaggio di conferma generico (nessuna user enumeration)
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        setFormError(t("errors.network"));
      } else {
        setFormError(t("errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.card}>
      <img src="/arcadium-icon-clean.png" alt="Arcadium" className={styles.logo} />
      <h1 className={styles.title}>{t("auth.forgot.title")}</h1>
      <p className={styles.subtitle}>{t("auth.forgot.subtitle")}</p>

      {formError && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      {done ? (
        // Stato "inviato": conferma generica. Non diciamo se l'email esiste.
        <div>
          <div className={styles.errorBanner} role="status"
               style={{ background: "rgba(74, 222, 128, 0.12)", color: "#4ade80", borderColor: "rgba(74, 222, 128, 0.3)" }}>
            <CheckCircle2 size={16} />
            <span>{t("auth.forgot.sent")}</span>
          </div>

          {/* Solo in sviluppo: link diretto al reset (nessuna email disponibile). */}
          {devLink && (
            <p className={styles.forgot} style={{ marginTop: "0.75rem" }}>
              <Link className={styles.link} href={devLink}>
                {t("auth.forgot.devLink")}
              </Link>
            </p>
          )}

          <p className={styles.alt} style={{ marginTop: "1.25rem" }}>
            <Link className={styles.link} href="/login">
              <ArrowLeft size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {t("auth.forgot.backToLogin")}
            </Link>
          </p>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            name="email"
            type="email"
            label={t("auth.fields.email")}
            placeholder="luca.rossi@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? t("common.loading") : t("auth.forgot.submit")}
          </Button>

          <p className={styles.alt} style={{ marginTop: "0.25rem" }}>
            <Link className={styles.link} href="/login">
              <ArrowLeft size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {t("auth.forgot.backToLogin")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
