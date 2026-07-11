"use client";

// Pagina di registrazione (M5 - T5) — COLLEGATA al backend (M5-T13)
// -----------------------------------------------------------------------------
// Stesso pattern della pagina di login: useAuth().register() chiama
// /api/auth/register tramite il client centralizzato (lib/api/client.js),
// salva token + utente, e al successo porta l'utente al negozio.

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

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!username.trim()) next.username = t("auth.validation.required");

    if (!email.trim()) next.email = t("auth.validation.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = t("auth.validation.invalidEmail");

    if (!password) next.password = t("auth.validation.required");
    else if (password.length < 6)
      next.password = t("auth.validation.passwordTooShort");

    if (!confirm) next.confirm = t("auth.validation.required");
    else if (confirm !== password)
      next.confirm = t("auth.register.passwordMismatch");

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
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        displayName: username.trim(), // fallback: usa lo username come nome visualizzato
        preferredLanguage: "it",
      });
      router.push("/negozio"); // registrazione riuscita -> catalogo (come il login)
    } catch (err) {
      // 409 = username/email già in uso; 400 = validazione backend fallita;
      // status 0 = backend non raggiungibile; altrimenti generico.
      if (err instanceof ApiError && (err.status === 409 || err.status === 400)) {
        setFormError(err.message || t("auth.register.error"));
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
      <img src="/arcadium-icon-clean.png" alt="Arcadium" className={styles.logo} />
      <h1 className={styles.title}>{t("auth.register.title")}</h1>
      <p className={styles.subtitle}>{t("auth.register.subtitle")}</p>

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
          placeholder="luca_rossi"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          autoComplete="username"
        />

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

        <div className={styles.passwordField}>
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            label={t("auth.fields.password")}
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
          {submitting ? t("common.loading") : t("auth.register.submit")}
        </Button>
      </form>

      <p className={styles.alt}>
        {t("auth.register.haveAccount")}{" "}
        <Link className={styles.link} href="/login">
          {t("auth.register.signIn")}
        </Link>
      </p>
    </div>
  );
}