"use client";

// app/career-dashboard/login/CareerLoginForm.jsx
//
// واجهة لوجن بوابة الكارير: خلفية بألوان الهوية (Navy + لمسات Sky/Gold) بدل صورة
// الكافيه المموّهة، بادج اللوجو الأبيض فوق، حقول بخط سفلي، وزرار ذهبي.
// نفس الفورم بيبدّل بين "Log in" و"Create one!" من غير ما يغيّر الصفحة.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, Eye, EyeOff, Languages, ArrowLeft } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SITE_NAME } from "../../lib/siteConfig";
import { T, fill } from "../i18n";

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^\+?[0-9\s-]{7,20}$/.test(v);
const toMinutes = (s) => Math.max(1, Math.ceil(Number(s) / 60));

const fieldWrap = "relative border-b border-white/35 transition-colors focus-within:border-gold";
const fieldInput =
  "w-full bg-transparent py-3 pe-9 text-sm text-white placeholder-white/55 outline-none";
const fieldIcon = "pointer-events-none absolute end-0 top-1/2 -translate-y-1/2 text-white/70";

export default function CareerLoginForm() {
  const { language, changeLanguage } = useLanguage();
  const t = T[language] || T.en;
  const router = useRouter();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isLogin = mode === "login";

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setError("");
  };

  function switchMode() {
    setMode(isLogin ? "register" : "login");
    setError("");
  }

  function describeError(code, data) {
    switch (code) {
      case "invalid_credentials":
        return Number(data?.remaining) > 0
          ? `${t.invalid} ${fill(t.attemptsLeft, { n: data.remaining })}`
          : t.invalid;
      case "account_locked":
        return fill(t.locked, { m: toMinutes(data?.retryAfterSeconds) });
      case "rate_limited":
      case "too_many_attempts":
        return fill(t.rateLimited, { m: toMinutes(data?.retryAfterSeconds) });
      case "account_suspended":
        return t.suspended;
      case "registration_disabled":
        return t.registrationOff;
      case "email_taken":
        return t.errEmailTaken;
      case "invalid_email":
        return t.errEmail;
      case "invalid_phone":
        return t.errPhone;
      case "invalid_name":
        return t.errName;
      case "weak_password":
        return t.errWeakPassword;
      case "missing_fields":
        return t.errEmpty;
      default:
        return t.genericError;
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const email = form.email.trim();
    if (!email || !form.password || (!isLogin && (!form.name.trim() || !form.phone.trim()))) {
      return setError(t.errEmpty);
    }
    if (!isValidEmail(email)) return setError(t.errEmail);
    if (!isLogin) {
      if (form.name.trim().length < 2) return setError(t.errName);
      if (!isValidPhone(form.phone.trim())) return setError(t.errPhone);
      if (form.password.length < 8) return setError(t.errWeakPassword);
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/career/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLogin
            ? { email, password: form.password }
            : { name: form.name.trim(), email, phone: form.phone.trim(), password: form.password }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(describeError(data?.error, data));
        setSubmitting(false);
        return;
      }
      router.replace("/career-dashboard");
      router.refresh();
    } catch {
      setError(t.genericError);
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-navy px-4 pb-10 pt-0">
      {/* خلفية الهوية: Navy بلمسات Sky/Gold مموّهة (بديل صورة الكافيه) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 start-[-10%] h-[28rem] w-[28rem] rounded-full bg-sky/35 blur-3xl" />
        <div className="absolute bottom-[-8rem] end-[-6%] h-[26rem] w-[26rem] rounded-full bg-gold/25 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/40 via-navy/70 to-navy" />
      </div>

      {/* اللغة */}
      <button
        type="button"
        onClick={() => changeLanguage(language === "ar" ? "en" : "ar")}
        className="absolute end-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-navy shadow transition hover:bg-white"
      >
        <Languages size={14} />
        {language === "ar" ? "English" : "العربية"}
      </button>
      <Link
        href="/careers"
        className="absolute start-4 top-4 z-10 inline-flex items-center gap-1.5 text-xs text-white/70 transition hover:text-gold"
      >
        <ArrowLeft size={14} className="rtl:rotate-180" />
        {t.backToSite}
      </Link>

      <div className="relative z-10 w-full max-w-[320px]">
        {/* بادج اللوجو (شكل درع زي المرجع) */}
        <div
          className="mx-auto flex h-36 w-64 items-start justify-center bg-white pt-8 shadow-xl"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 58%, 50% 100%, 0 58%)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt={SITE_NAME} className="h-16 w-auto object-contain" />
        </div>

        <h1 className="mt-6 text-center font-display text-xl font-bold text-white">
          {isLogin ? t.loginTitle : t.registerTitle}
        </h1>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
          {!isLogin && (
            <div className={fieldWrap}>
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={set("name")}
                placeholder={t.name}
                aria-label={t.name}
                maxLength={100}
                className={fieldInput}
              />
              <User size={16} className={fieldIcon} />
            </div>
          )}

          <div className={fieldWrap}>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              placeholder={t.email}
              aria-label={t.email}
              maxLength={254}
              dir="ltr"
              className={`${fieldInput} text-start`}
            />
            <Mail size={16} className={fieldIcon} />
          </div>

          {!isLogin && (
            <div className={fieldWrap}>
              <input
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder={t.phone}
                aria-label={t.phone}
                maxLength={20}
                dir="ltr"
                className={`${fieldInput} text-start`}
              />
              <Phone size={16} className={fieldIcon} />
            </div>
          )}

          <div>
            <div className={fieldWrap}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={form.password}
                onChange={set("password")}
                placeholder={t.password}
                aria-label={t.password}
                maxLength={128}
                dir="ltr"
                className={`${fieldInput} text-start pe-16`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t.hidePassword : t.showPassword}
                className="absolute end-6 top-1/2 -translate-y-1/2 text-white/70 transition hover:text-gold"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <Lock size={16} className={fieldIcon} />
            </div>
            {!isLogin && <p className="mt-1.5 text-xs text-white/60">{t.passwordHint}</p>}
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-center text-xs font-medium text-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-gold py-3 text-sm font-bold tracking-wide text-navy shadow-lg shadow-gold/20 transition hover:bg-[#b3901f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLogin ? (submitting ? t.loggingIn : t.logIn) : submitting ? t.signingUp : t.signUp}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/85">
          {isLogin ? t.noAccount : t.haveAccount}{" "}
          <button type="button" onClick={switchMode} className="font-semibold text-gold underline underline-offset-4 hover:text-white">
            {isLogin ? t.createOne : t.backToLogin}
          </button>
        </p>
      </div>
    </div>
  );
}
