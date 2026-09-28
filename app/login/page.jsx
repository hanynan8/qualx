"use client";

// app/login/page.jsx
//
// صفحة تسجيل الدخول. بتستخدم next-auth/react → signIn("credentials", ...)
// اللي بيوديك على authorize() في app/lib/authOptions.js (بيكلم mongoose
// مباشرة، مش بيعدي على /api/data خالص — شوف التعليقات هناك).
//
// ملحوظة: مفيش صفحة تسجيل (register) دلوقتي — الحسابات بتتضاف يدويًا في
// كولكشن "auth" بمونجو. الصفحة دي بس لتسجيل الدخول بحساب موجود.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useLanguage } from "../../contexts/LanguageContext";

const TEXT = {
  en: {
    title: "Sign in",
    subtitle: "Access your Qualx account.",
    nameOrEmail: "Name or email",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in…",
    error: "Incorrect name/email or password.",
    genericError: "Something went wrong. Please try again.",
    backHome: "← Back to homepage",
    alreadyIn: "You're already signed in as",
    goHome: "Go to homepage",
  },
  ar: {
    title: "تسجيل الدخول",
    subtitle: "ادخل إلى حسابك في Qualx.",
    nameOrEmail: "الاسم أو البريد الإلكتروني",
    password: "كلمة المرور",
    submit: "تسجيل الدخول",
    submitting: "جاري تسجيل الدخول…",
    error: "الاسم/البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    genericError: "حدث خطأ ما، حاول تاني.",
    backHome: "→ العودة للرئيسية",
    alreadyIn: "أنت مسجل دخول بالفعل باسم",
    goHome: "الذهاب للرئيسية",
  },
};

export default function LoginPage() {
  const { language } = useLanguage();
  const t = TEXT[language] || TEXT.en;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [nameOrEmail, setNameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // لو مسجل دخول بالفعل، مفيش داعي نعرضله الفورم تاني.
  if (status === "authenticated") {
    return (
      <div className="container-content flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-charcoal">
          {t.alreadyIn} <strong>{session.user?.name}</strong>
        </p>
        <Link href="/" className="btn-primary">
          {t.goHome}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        nameOrEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t.error);
        return;
      }

      // signIn بيبعث تحديث تلقائي لأي useSession() تاني في الصفحة (زي
      // Navbar)، لكن بنعمل refresh() برضه عشان أي جزء متعمل server-render
      // بناءً على الجلسة (زي layout.jsx) ياخد النسخة الجديدة.
      router.push("/");
      router.refresh();
    } catch {
      setError(t.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-content flex min-h-[70vh] items-center justify-center py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-charcoal/10 bg-white p-8 shadow-sm"
      >
        <h1 className="font-display text-2xl font-semibold text-navy">{t.title}</h1>
        <p className="mt-1 text-sm text-charcoal/70">{t.subtitle}</p>

        <label className="mt-6 block text-sm font-medium text-charcoal">
          {t.nameOrEmail}
          <input
            type="text"
            required
            autoComplete="username"
            value={nameOrEmail}
            onChange={(e) => setNameOrEmail(e.target.value)}
            className="mt-1 w-full rounded border border-charcoal/20 px-3 py-2 text-sm outline-none focus:border-sky"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-charcoal">
          {t.password}
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-charcoal/20 px-3 py-2 text-sm outline-none focus:border-sky"
          />
        </label>

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
          {submitting ? t.submitting : t.submit}
        </button>

        <Link
          href="/"
          className="mt-4 block text-center text-sm text-charcoal/60 hover:text-navy"
        >
          {t.backHome}
        </Link>
      </form>
    </div>
  );
}