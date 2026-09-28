"use client";

// app/components/auth/AuthForm.jsx
//
// فورم واحد لتسجيل الدخول وإنشاء الحساب (mode = "login" | "register")، على
// نفس فكرة LoginRegisterForm في Edumaster. صفحتين بيستخدموه: /login و /register.
//
// أخطاء الدخول بترجع من authorize() كنص "code:number" وبنفسّرها هنا:
//   invalid_credentials:N · account_locked:S · rate_limited:S ·
//   account_suspended · mfa_required · mfa_invalid:N
// أخطاء التسجيل بترجع من /api/register كـ { error: "..." }.
// بعد التسجيل الناجح بنعمل دخول تلقائي بنفس البيانات.

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession, useSession } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

const TEXT = {
  en: {
    loginTitle: "Sign in",
    loginSubtitle: "Access your Qualx account.",
    registerTitle: "Create account",
    registerSubtitle: "Enter your details to get started.",
    nameOrEmail: "Name or email",
    name: "Full name",
    email: "Email",
    phone: "Phone number",
    phonePlaceholder: "01xxxxxxxxx",
    password: "Password",
    passwordHint: "At least 8 characters.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    login: "Sign in",
    loggingIn: "Signing in…",
    register: "Create account",
    registering: "Creating account…",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    errEmpty: "Please fill in all fields.",
    invalid: "Incorrect name/email or password.",
    attemptsLeft: "{n} attempt(s) left before the account is temporarily locked.",
    locked: "Account temporarily locked after too many failed attempts. Try again in {m} minute(s).",
    rateLimited: "Too many attempts from this network. Try again in {m} minute(s).",
    suspended: "This account is suspended. Please contact support.",
    genericError: "Something went wrong. Please try again.",
    mfaTitle: "Verification code",
    mfaSubtitle: "Enter the 6-digit code from your authenticator app, or one of your backup codes.",
    mfaLabel: "Code",
    mfaSubmit: "Verify and sign in",
    mfaInvalid: "Invalid code.",
    back: "Back",
    backHome: "← Back to homepage",
    alreadyIn: "You're already signed in as",
    goHome: "Go to homepage",
    goAdmin: "Go to dashboard",
    errName: "Enter a name of at least 2 characters, without the @ symbol.",
    errEmail: "Enter a valid email address.",
    errPhone: "Enter a valid phone number.",
    errWeakPassword: "Password must be at least 8 characters.",
    errNameTaken: "This name is already taken, try another one.",
    errEmailTaken: "This email is already registered. Try signing in.",
    errRegisterLimited: "Too many sign-ups from this network. Try again in {m} minute(s).",
    errRegistrationOff: "Sign-up is currently closed.",
    registeredPleaseLogin: "Account created. Please sign in.",
  },
  ar: {
    loginTitle: "تسجيل الدخول",
    loginSubtitle: "ادخل إلى حسابك في Qualx.",
    registerTitle: "إنشاء حساب",
    registerSubtitle: "أدخل بياناتك لإنشاء حساب جديد.",
    nameOrEmail: "الاسم أو البريد الإلكتروني",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    phonePlaceholder: "01xxxxxxxxx",
    password: "كلمة المرور",
    passwordHint: "8 أحرف على الأقل.",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    login: "تسجيل الدخول",
    loggingIn: "جاري تسجيل الدخول…",
    register: "إنشاء الحساب",
    registering: "جاري إنشاء الحساب…",
    noAccount: "ليس لديك حساب؟",
    signUp: "سجّل الآن",
    haveAccount: "لديك حساب بالفعل؟",
    signIn: "سجّل دخولك",
    errEmpty: "يُرجى إدخال جميع البيانات.",
    invalid: "الاسم/البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    attemptsLeft: "تبقّى {n} محاولة قبل قفل الحساب مؤقتًا.",
    locked: "تم قفل الحساب مؤقتًا بسبب محاولات خاطئة كثيرة. حاول مرة أخرى بعد {m} دقيقة.",
    rateLimited: "محاولات كثيرة من نفس الشبكة. حاول مرة أخرى بعد {m} دقيقة.",
    suspended: "هذا الحساب موقوف. تواصل مع الدعم.",
    genericError: "حدث خطأ ما، حاول تاني.",
    mfaTitle: "كود التحقق",
    mfaSubtitle: "أدخل الكود المكوّن من 6 أرقام من تطبيق المصادقة، أو أحد الأكواد الاحتياطية.",
    mfaLabel: "الكود",
    mfaSubmit: "تحقق وسجّل الدخول",
    mfaInvalid: "الكود غير صحيح.",
    back: "رجوع",
    backHome: "→ العودة للرئيسية",
    alreadyIn: "أنت مسجل دخول بالفعل باسم",
    goHome: "الذهاب للرئيسية",
    goAdmin: "الذهاب للوحة التحكم",
    errName: "أدخل اسمًا من حرفين على الأقل، وبدون علامة @.",
    errEmail: "أدخل بريدًا إلكترونيًا صحيحًا.",
    errPhone: "رقم الهاتف ليس بصيغة صحيحة.",
    errWeakPassword: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    errNameTaken: "هذا الاسم مستخدم بالفعل، جرّب اسمًا آخر.",
    errEmailTaken: "هذا البريد الإلكتروني مسجّل بالفعل، جرّب تسجيل الدخول.",
    errRegisterLimited: "تسجيلات كثيرة من نفس الشبكة. حاول مرة أخرى بعد {m} دقيقة.",
    errRegistrationOff: "التسجيل مغلق حاليًا.",
    registeredPleaseLogin: "تم إنشاء الحساب. سجّل دخولك الآن.",
  },
};

const fill = (str, vars) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), str);
const toMinutes = (seconds) => Math.max(1, Math.ceil(Number(seconds) / 60));

// callbackUrl لازم يبقى مسار داخلي بس (منع open-redirect).
function safeCallback(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : null;
}

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^\+?[0-9\s-]{7,20}$/.test(v);

const inputClass =
  "mt-1 w-full rounded border border-charcoal/20 px-3 py-2 text-sm outline-none focus:border-sky";

export default function AuthForm({ mode }) {
  const isLogin = mode === "login";
  const { language } = useLanguage();
  const t = TEXT[language] || TEXT.en;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [form, setForm] = useState({ nameOrEmail: "", name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("credentials"); // "credentials" | "mfa"
  const [mfaCode, setMfaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = safeCallback(searchParams.get("callbackUrl"));
  const switchHref = (path) =>
    callbackUrl ? `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}` : path;

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setError("");
  };

  if (status === "authenticated") {
    const isAdmin = session.user?.role === "admin";
    return (
      <div className="container-content flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-charcoal">
          {t.alreadyIn} <strong>{session.user?.name}</strong>
        </p>
        <Link href={isAdmin ? "/admin" : "/"} className="btn-primary">
          {isAdmin ? t.goAdmin : t.goHome}
        </Link>
      </div>
    );
  }

  function describeLoginError(raw) {
    const [code, num] = String(raw || "").split(":");
    switch (code) {
      case "invalid_credentials":
        return Number(num) > 0 ? `${t.invalid} ${fill(t.attemptsLeft, { n: num })}` : t.invalid;
      case "mfa_invalid":
        return Number(num) > 0
          ? `${t.mfaInvalid} ${fill(t.attemptsLeft, { n: num })}`
          : t.mfaInvalid;
      case "account_locked":
        return fill(t.locked, { m: toMinutes(num) });
      case "rate_limited":
        return fill(t.rateLimited, { m: toMinutes(num) });
      case "account_suspended":
        return t.suspended;
      case "CredentialsSignin":
        return t.invalid;
      default:
        return t.genericError;
    }
  }

  async function finishLogin() {
    const fresh = await getSession();
    const target = callbackUrl || (fresh?.user?.role === "admin" ? "/admin" : "/");
    setForm((f) => ({ ...f, password: "" }));
    setMfaCode("");
    router.push(target);
    router.refresh();
  }

  // بيرجّع true لو الدخول نجح (والتحويل اتعمل)، false لو لأ (الخطأ اتعرض).
  async function attemptLogin(identifier, password, code = "") {
    const result = await signIn("credentials", {
      nameOrEmail: identifier,
      password,
      mfaCode: code,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === "mfa_required") {
        setStep("mfa");
        return false;
      }
      const errCode = result.error.split(":")[0];
      if (errCode === "account_locked" || errCode === "rate_limited") {
        setStep("credentials");
        setMfaCode("");
      }
      setError(describeLoginError(result.error));
      return false;
    }
    await finishLogin();
    return true;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (step === "credentials" && (!form.nameOrEmail || !form.password)) {
      setError(t.errEmpty);
      return;
    }
    if (step === "mfa" && !mfaCode) {
      setError(t.errEmpty);
      return;
    }
    setSubmitting(true);
    try {
      await attemptLogin(form.nameOrEmail, form.password, step === "mfa" ? mfaCode : "");
    } catch {
      setError(t.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!name || !email || !phone || !form.password) return setError(t.errEmpty);
    if (name.length < 2 || name.includes("@")) return setError(t.errName);
    if (!isValidEmail(email)) return setError(t.errEmail);
    if (!isValidPhone(phone)) return setError(t.errPhone);
    if (form.password.length < 8) return setError(t.errWeakPassword);

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password: form.password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          return setError(fill(t.errRegisterLimited, { m: toMinutes(data.retryAfterSeconds) }));
        }
        const map = {
          name_taken: t.errNameTaken,
          email_taken: t.errEmailTaken,
          weak_password: t.errWeakPassword,
          invalid_phone: t.errPhone,
          invalid_email: t.errEmail,
          invalid_name: t.errName,
          registration_disabled: t.errRegistrationOff,
        };
        return setError(map[data.error] || t.genericError);
      }

      // دخول تلقائي بنفس البيانات. لو فشل لأي سبب، نوديه لصفحة الدخول.
      const ok = await attemptLogin(email, form.password);
      if (!ok) {
        router.push(switchHref("/login"));
      }
    } catch {
      setError(t.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  const inMfa = isLogin && step === "mfa";
  const title = inMfa ? t.mfaTitle : isLogin ? t.loginTitle : t.registerTitle;
  const subtitle = inMfa ? t.mfaSubtitle : isLogin ? t.loginSubtitle : t.registerSubtitle;
  const submitLabel = submitting
    ? isLogin
      ? t.loggingIn
      : t.registering
    : inMfa
      ? t.mfaSubmit
      : isLogin
        ? t.login
        : t.register;

  const passwordField = (autoComplete) => (
    <label className="mt-4 block text-sm font-medium text-charcoal">
      {t.password}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          required
          maxLength={128}
          minLength={isLogin ? undefined : 8}
          autoComplete={autoComplete}
          value={form.password}
          onChange={set("password")}
          className={`${inputClass} pe-10`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? t.hidePassword : t.showPassword}
          className="absolute inset-y-0 end-0 flex items-center px-3 text-charcoal/50 hover:text-navy"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {!isLogin && <span className="mt-1 block text-xs font-normal text-charcoal/50">{t.passwordHint}</span>}
    </label>
  );

  return (
    <div className="container-content flex min-h-[70vh] items-center justify-center py-16">
      <form
        onSubmit={isLogin ? handleLogin : handleRegister}
        noValidate={!isLogin}
        className="w-full max-w-sm rounded-lg border border-charcoal/10 bg-white p-8 shadow-sm"
      >
        <h1 className="font-display text-2xl font-semibold text-navy">{title}</h1>
        <p className="mt-1 text-sm text-charcoal/70">{subtitle}</p>

        {isLogin && !inMfa && (
          <>
            <label className="mt-6 block text-sm font-medium text-charcoal">
              {t.nameOrEmail}
              <input
                type="text"
                required
                maxLength={254}
                autoComplete="username"
                value={form.nameOrEmail}
                onChange={set("nameOrEmail")}
                className={inputClass}
              />
            </label>
            {passwordField("current-password")}
          </>
        )}

        {inMfa && (
          <label className="mt-6 block text-sm font-medium text-charcoal">
            {t.mfaLabel}
            <input
              type="text"
              required
              autoFocus
              maxLength={32}
              autoComplete="one-time-code"
              dir="ltr"
              value={mfaCode}
              onChange={(e) => {
                setMfaCode(e.target.value);
                setError("");
              }}
              className={`${inputClass} tracking-widest`}
            />
          </label>
        )}

        {!isLogin && (
          <>
            <label className="mt-6 block text-sm font-medium text-charcoal">
              {t.name}
              <input
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                value={form.name}
                onChange={set("name")}
                className={inputClass}
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-charcoal">
              {t.email}
              <input
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                dir="ltr"
                value={form.email}
                onChange={set("email")}
                className={inputClass}
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-charcoal">
              {t.phone}
              <input
                type="tel"
                required
                maxLength={20}
                autoComplete="tel"
                dir="ltr"
                placeholder={t.phonePlaceholder}
                value={form.phone}
                onChange={set("phone")}
                className={inputClass}
              />
            </label>
            {passwordField("new-password")}
          </>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitLabel}
        </button>

        {inMfa ? (
          <button
            type="button"
            onClick={() => {
              setStep("credentials");
              setMfaCode("");
              setError("");
            }}
            className="mt-4 block w-full text-center text-sm text-charcoal/60 hover:text-navy"
          >
            {t.back}
          </button>
        ) : (
          <>
            <p className="mt-5 text-center text-sm text-charcoal/70">
              {isLogin ? t.noAccount : t.haveAccount}{" "}
              <Link
                href={switchHref(isLogin ? "/register" : "/login")}
                className="font-medium text-sky hover:text-navy"
              >
                {isLogin ? t.signUp : t.signIn}
              </Link>
            </p>
            <Link href="/" className="mt-3 block text-center text-sm text-charcoal/60 hover:text-navy">
              {t.backHome}
            </Link>
          </>
        )}
      </form>
    </div>
  );
}
