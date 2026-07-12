"use client";

// Pagina "Reimposta password" — passo 2 del recupero password (M4-T17)
// -----------------------------------------------------------------------------
// L'utente arriva qui dal link ricevuto: il token è nella query string
// (?token=...). Sceglie una nuova password (con conferma) e la invia al backend
// insieme al token. Esiti:
//   - 200: password aggiornata -> messaggio di successo + link al login;
//   - 400: token assente/scaduto/già usato -> messaggio + link per richiederne
//          uno nuovo.
//
// useSearchParams() va usato dentro un confine <Suspense> (requisito Next.js),
// quindi la pagina è divisa in un wrapper con Suspense e il form vero e proprio.

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/Input/Input";
import { Button } from "@/components/Button/Button";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import styles from "../auth-card.module.css";

// Componente interno: legge il token dall'URL e gestisce il form.
function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);           // reset riuscito
  const [invalidToken, setInvalidToken] = useState(false); // 400 dal backend
  const [submitting, setSubmitting] = useState(false);

  // Validazione lato client: password >= 8 caratteri (come il backend) e conferma uguale.
  function validate() {
    const next = {};
    if (!password) next.password = t("auth.validation.required");
    else if (password.length < 8)
      next.password = t("auth.validation.passwordTooShort");

    if (!confirm) next.confirm = t("auth.validation.required");
    else if (confirm !== password)
      next.confirm = t("auth.register.passwordMismatch");

    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    // Token mancante nell'URL: link malformato, non ha senso chiamare il backend.
    if (!token) {
      setInvalidToken(true);
      return;
    }

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      // Piccola cortesia: dopo qualche secondo si va al login.
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setInvalidToken(true); // token scaduto/non valido/già usato
      } else if (err instanceof ApiError && err.status === 0) {
        setFormError(t("errors.network"));
      } else {
        setFormError(t("errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Stato finale: reset riuscito.
  if (done) {
    return (
      <div className={styles.card}>
        <img src="/arcadium-icon-clean.png" alt="Arcadium" className={styles.logo} />
        <h1 className={styles.title}>{t("auth.reset.title")}</h1>
        <div className={styles.errorBanner} role="status"
             style={{ background: "rgba(74, 222, 128, 0.12)", color: "#4ade80", borderColor: "rgba(74, 222, 128, 0.3)" }}>
          <CheckCircle2 size={16} />
          <span>{t("auth.reset.success")}</span>
        </div>
        <p className={styles.alt} style={{ marginTop: "1.25rem" }}>
          <Link className={styles.link} href="/login">
            {t("auth.reset.goToLogin")}
          </Link>
        </p>
      </div>
    );
  }

  // Stato di errore: token non valido/scaduto/mancante.
  if (invalidToken) {
    return (
      <div className={styles.card}>
        <img src="/arcadium-icon-clean.png" alt="Arcadium" className={styles.logo} />
        <h1 className={styles.title}>{t("auth.reset.title")}</h1>
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} />
          <span>{t("auth.reset.invalidToken")}</span>
        </div>
        <p className={styles.alt} style={{ marginTop: "1.25rem" }}>
          <Link className={styles.link} href="/recupero-password">
            {t("auth.reset.requestNew")}
          </Link>
        </p>
      </div>
    );
  }

  // Form principale: scelta della nuova password.
  return (
    <div className={styles.card}>
      <img src="/arcadium-icon-clean.png" alt="Arcadium" className={styles.logo} />
      <h1 className={styles.title}>{t("auth.reset.title")}</h1>
      <p className={styles.subtitle}>{t("auth.reset.subtitle")}</p>

      {formError && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.passwordField}>
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            label={t("auth.reset.newPassword")}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />
          <button
            type="button"
            className={styles.eyeButton}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword
                ? t("auth.fields.hidePassword")
                : t("auth.fields.showPassword")
            }
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Input
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          label={t("auth.fields.confirmPassword")}
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? t("common.loading") : t("auth.reset.submit")}
        </Button>
      </form>

      <p className={styles.alt}>
        <Link className={styles.link} href="/login">
          {t("auth.reset.goToLogin")}
        </Link>
      </p>
    </div>
  );
}

// Wrapper con Suspense richiesto da useSearchParams (Next.js App Router).
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
