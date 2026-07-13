"use client";

// Pagina di accesso (M5 - T5) — COLLEGATA al backend (M5-T13)
// -----------------------------------------------------------------------------
// Stessa scheda "Bentornato" del mockup, ma ora l'accesso è reale:
// - il backend autentica per USERNAME + password (DTO LoginRequest);
// - useAuth().login() chiama /api/auth/login, salva il token e l'utente;
// - al successo si va al negozio; in caso di errore si mostra il banner.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Input } from "@/components/Input/Input";
import { Button } from "@/components/Button/Button";
import { useAuth } from "@/context/AuthProvider";
import { ApiError } from "@/lib/api/client";
import styles from "../auth-card.module.css";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});       // messaggi per singolo campo
  const [formError, setFormError] = useState("");  // banner in cima
  const [submitting, setSubmitting] = useState(false); // blocca il pulsante mentre invia

  // Validazione minima lato client: i due campi non devono essere vuoti.
  function validate() {
    const next = {};
    if (!username.trim()) next.username = t("auth.validation.required");
    if (!password) next.password = t("auth.validation.required");
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
      // Chiamata reale al backend: se va a buon fine, token e utente sono salvati.
      await login(username.trim(), password);
      router.push("/negozio"); // accesso riuscito -> catalogo
    } catch (err) {
      // 401 = credenziali errate; status 0 = backend non raggiungibile; altrimenti generico.
      if (err instanceof ApiError && err.status === 401) {
        setFormError(t("auth.login.error"));
      } else if (err instanceof ApiError && err.status === 0) {
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
        {/* eslint-disable-next-line @next/next/no-img-element -- logo statico da /public con dimensioni fissate dal CSS: next/image non porta benefici e imporrebbe width/height espliciti. */}
        <img src="/arcadium-icon-clean.png" alt="Arcadium" className={styles.logo} />
        <h1 className={styles.title}>{t("auth.login.title")}</h1>
        <p className={styles.subtitle}>{t("auth.login.subtitle")}</p>

        {formError && (
            <div className={styles.errorBanner} role="alert">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
              name="username"
              type="text"
              label={t("auth.fields.username")}
              placeholder="luca"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
              autoComplete="username"
          />

          <div className={styles.passwordField}>
            <Input
                name="password"
                type={showPassword ? "text" : "password"}
                label={t("auth.fields.password")}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="current-password"
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

          <p className={styles.forgot}>
            <Link className={styles.link} href="/recupero-password">
              {t("auth.login.forgotPassword")}
            </Link>
          </p>

          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? t("common.loading") : t("auth.login.submit")}
          </Button>
        </form>

        <p className={styles.alt}>
          {t("auth.login.noAccount")}{" "}
          <Link className={styles.link} href="/registrazione">
            {t("auth.login.signUp")}
          </Link>
        </p>
      </div>
  );
}