// components/Navbar.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Globe, LogOut, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../lib/useCollectionData";

// 🔐 نصوص واجهة تسجيل الدخول/الخروج — محلية هنا (مش جايه من كولكشن
// "navbar" في مونجو) لأنها سلوك ثابت في الموقع مش محتوى بيتغير من لوحة
// الأدمن، فمفيش داعي نعقّد شكل الـ document في الداتابيز عشانها.
const AUTH_TEXT = {
  en: { login: "Log in", logout: "Log out" },
  ar: { login: "تسجيل الدخول", logout: "تسجيل الخروج" },
};

// 🔄 DYNAMIC: كان فيه NAV_LINKS ثابتة جوه الكومبوننت. دلوقتي الروابط
// والنصوص جايين من كولكشن "navbar" في مونجو (document واحد بيتعدل من
// لوحة الأدمن لاحقًا). لحد ما الكولكشن يتعمل seed أو الأدمن يحفظ حاجة،
// FALLBACK ده بيمنع الموقع يبان فاضي.
const FALLBACK_NAVBAR = {
  brandLetter: "Q",
  links: [
    { id: "home", href: "/" },
    { id: "services", href: "/services" },
    { id: "careers", href: "/careers" },
  ],
  i18n: {
    en: { brand: "Qualx", links: { home: "Home", services: "Services", careers: "Careers" }, quote: "Get a quote" },
    ar: { brand: "Qualx", links: { home: "الرئيسية", services: "خدماتنا", careers: "وظائف" }, quote: "اطلب عرض سعر" },
  },
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const { data } = useCollectionData("navbar");
  const { data: session, status } = useSession();

  const navbar = data || FALLBACK_NAVBAR;
  const t = pickTranslation(navbar, language) || FALLBACK_NAVBAR.i18n.en;
  const links = navbar.links || FALLBACK_NAVBAR.links;
  const authText = AUTH_TEXT[language] || AUTH_TEXT.en;

  return (
    <header className="sticky top-0 z-50 bg-navy text-offwhite">
      <div className="container-content flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-wide">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-gold text-navy">
            {navbar.brandLetter || FALLBACK_NAVBAR.brandLetter}
          </span>
          {t.brand}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="text-sm font-medium text-offwhite/85 transition-colors hover:text-gold"
            >
              {t.links?.[link.id] || link.id}
            </Link>
          ))}
          <Link href="/services" className="btn-primary text-sm">
            {t.quote}
          </Link>
          <LangSwitcher language={language} onChange={changeLanguage} />
          <AuthControl status={status} session={session} authText={authText} />
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <LangSwitcher language={language} onChange={changeLanguage} compact />
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className="text-offwhite"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-offwhite/10 bg-navy md:hidden">
          <div className="container-content flex flex-col gap-1 py-3">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded px-2 py-2 text-sm font-medium text-offwhite/90 hover:bg-offwhite/5"
              >
                {t.links?.[link.id] || link.id}
              </Link>
            ))}
            <Link
              href="/services"
              onClick={() => setOpen(false)}
              className="mt-2 inline-block rounded bg-gold px-4 py-2 text-center text-sm font-semibold text-navy"
            >
              {t.quote}
            </Link>
            <div className="mt-2 border-t border-offwhite/10 pt-2">
              <AuthControl
                status={status}
                session={session}
                authText={authText}
                onNavigate={() => setOpen(false)}
                mobile
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// زرار بسيط للتبديل بين EN/AR. مش محتاجين dropdown معقد لغتين بس دلوقتي.
function LangSwitcher({ language, onChange, compact = false }) {
  const other = language === "en" ? "ar" : "en";
  return (
    <button
      onClick={() => onChange(other)}
      className="flex items-center gap-1.5 rounded border border-offwhite/25 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-offwhite/85 transition-colors hover:border-gold hover:text-gold"
      aria-label="Switch language"
    >
      <Globe size={14} />
      {other}
    </button>
  );
}

// 🔐 حالة الدخول في الناڤ بار: "loading" (أول لحظة تحميل، الجلسة جاية
// جاهزة من السيرفر فمش هتفضل معلقة)، "authenticated" (اسم المستخدم +
// زرار خروج)، أو "unauthenticated" (رابط دخول).
function AuthControl({ status, session, authText, mobile = false, onNavigate }) {
  if (status === "loading") return null;

  if (status === "authenticated") {
    return (
      <div className={mobile ? "flex items-center justify-between px-2 py-2" : "flex items-center gap-3"}>
        <span className="flex items-center gap-1.5 text-sm font-medium text-offwhite/85">
          <User size={14} />
          {session.user?.name}
        </span>
        <button
          onClick={() => {
            onNavigate?.();
            signOut({ callbackUrl: "/" });
          }}
          className="flex items-center gap-1 text-sm font-medium text-offwhite/70 hover:text-gold"
        >
          <LogOut size={14} />
          {authText.logout}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      onClick={onNavigate}
      className={
        mobile
          ? "block rounded px-2 py-2 text-sm font-medium text-offwhite/90 hover:bg-offwhite/5"
          : "text-sm font-medium text-offwhite/85 transition-colors hover:text-gold"
      }
    >
      {authText.login}
    </Link>
  );
}