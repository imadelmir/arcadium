"use client";

// Login page (M5 - T5)
// -----------------------------------------------------------------------------
// The "Bentornato" card from the mockup: email + password (with a show/hide
// eye), an error banner, the "Accedi" button and the links below.
//
// NOTE: the real sign-in (JWT) is the backend's job (M4-T3) and will be wired
// up during the frontend-backend integration (M5-T13). For now onSubmit only
// validates the fields and shows the error banner, without calling the API.

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Input } from "@/components/Input/Input";
import { Button } from "@/components/Button/Button";
import styles from "../auth-card.module.css";

export default function LoginPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});   // per-field messages
  const [formError, setFormError] = useState(""); // top banner

  function validate() {
    const next = {};
    if (!email.trim()) next.email = t("auth.validation.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = t("auth.validation.invalidEmail");
    if (!password) next.password = t("auth.validation.required");
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);

    if (Object.keys(next).length > 0) {
      setFormError("");
      return;
    }

    // No backend yet (M4-T3 / M5-T13): we just show the mockup error state.
    setFormError(t("auth.login.error"));
  }

  return (
    <div className={styles.card}>
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
          <Link className={styles.link} href="#">
            {t("auth.login.forgotPassword")}
          </Link>
        </p>

        <Button type="submit" fullWidth>
          {t("auth.login.submit")}
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