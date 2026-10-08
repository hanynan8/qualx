// components/Navbar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Globe, LogOut, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../lib/useCollectionData";

// 🔐 نصوص واجهة تسجيل الدخول/الخروج — محلية هنا (مش جايه من كولكشن
// "navbar" في مونجو) لأنها سلوك ثابت في الموقع مش محتوى بيتغير من لوحة
// الأدمن، فمفيش داعي نعقّد شكل الـ document في الداتابيز عشانها.
const AUTH_TEXT = {
  en: { login: "Log in", signup: "Sign up", logout: "Log out" },
  ar: { login: "تسجيل الدخول", signup: "إنشاء حساب", logout: "تسجيل الخروج" },
};

// 🔄 DYNAMIC: كان فيه NAV_LINKS ثابتة جوه الكومبوننت. دلوقتي الروابط
// والنصوص جايين من كولكشن "navbar" في مونجو (document واحد بيتعدل من
// لوحة الأدمن لاحقًا). لحد ما الكولكشن يتعمل seed أو الأدمن يحفظ حاجة،
// FALLBACK ده بيمنع الموقع يبان فاضي.
const FALLBACK_NAVBAR = {
  links: [
    { id: "home", href: "/" },
    { id: "services", href: "/services" },
    { id: "careers", href: "/careers" },
  ],
  i18n: {
    en: { brand: "Merlix", links: { home: "Home", services: "Services", careers: "Careers" }, quote: "Get a quote" },
    ar: { brand: "Merlix", links: { home: "الرئيسية", services: "خدماتنا", careers: "وظائف" }, quote: "اطلب عرض سعر" },
  },
};  

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { language, changeLanguage } = useLanguage();
  const { data } = useCollectionData("navbar");
  const { data: session, status } = useSession();

  const navbar = data || FALLBACK_NAVBAR;
  const t = pickTranslation(navbar, language) || FALLBACK_NAVBAR.i18n.en;
  const links = navbar.links || FALLBACK_NAVBAR.links;
  const authText = AUTH_TEXT[language] || AUTH_TEXT.en;

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  // الناف بار الطويل بيصغر لما المستخدم ينزل بالصفحة عشان ما ياخدش مساحة.
  useEffect(() => {
    const onScroll = () => setScrolled((prev) => (prev ? window.scrollY > 10 : window.scrollY > 80));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // 🐛 الـ wrapper ده بيحجز مساحة الناف بار بارتفاع ثابت، والـ header نفسه
    // fixed. كده لما الناف بار يصغّر مع السكرول ارتفاع الصفحة ما بيتغيّرش،
    // فمفيش scroll anchoring يرجّع السكرول فوق الحد ويعمل تذبذب (نزول/طلوع).
    <div className="h-20 xl:h-24">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy text-offwhite shadow-lg shadow-navy/30">
      <div
        className={`mx-auto flex w-full max-w-[1600px] items-stretch justify-between px-6 transition-[height] duration-300 h-20 ${
          scrolled ? "xl:h-16" : "xl:h-24"
        }`}
      >
        <Link href="/" className="flex items-center gap-3 font-display text-2xl font-bold tracking-wide">
          <span className="xl:text-2xl">{t.brand}</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-10 xl:flex">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.id}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`group relative py-2 text-base font-medium transition-colors hover:text-gold ${
                  active ? "text-gold" : "text-offwhite/85"
                }`}
              >
                {t.links?.[link.id] || link.id}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-center rounded-full bg-gold transition-transform duration-300 ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 border-x border-white/10 px-6 xl:flex">
          <Link href="/services" className="btn-primary !px-4 !py-2 text-sm">
            {t.quote}
          </Link>
          <LangSwitcher language={language} onChange={changeLanguage} />
          <AuthControl status={status} session={session} authText={authText} />
        </div>

        <div className="flex items-center gap-3 xl:hidden">
          <LangSwitcher language={language} onChange={changeLanguage} compact />
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-offwhite transition-colors hover:border-gold hover:text-gold"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="svc-rise border-t border-white/10 bg-navy xl:hidden">
          <div className="container-content flex flex-col gap-1 py-4">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-gold/10 text-gold" : "text-offwhite/90 hover:bg-white/5"
                  }`}
                >
                  {t.links?.[link.id] || link.id}
                </Link>
              );
            })}
            <Link
              href="/services"
              onClick={() => setOpen(false)}
              className="btn-primary mt-3 justify-center text-sm"
            >
              {t.quote}
            </Link>
            <div className="mt-3 border-t border-white/10 pt-3">
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
    </div>
  );
}

// زرار بسيط للتبديل بين EN/AR. مش محتاجين dropdown معقد لغتين بس دلوقتي.
function LangSwitcher({ language, onChange, compact = false }) {
  const other = language === "en" ? "ع" : "en";
  return (
    <button
      onClick={() => onChange(other)}
      className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-offwhite/85 transition-colors hover:border-gold hover:text-gold"
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
        {session.user?.role === "admin" ? (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center gap-1.5 text-sm font-medium text-offwhite/85 hover:text-gold"
          >
            <User size={14} />
            {session.user?.name}
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-medium text-offwhite/85">
            <User size={14} />
            {session.user?.name}
          </span>
        )}
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
    <div className={mobile ? "flex flex-col" : "flex items-center gap-4"}>
      <Link
        href="/login"
        onClick={onNavigate}
        className={
          mobile
            ? "block rounded-xl px-3 py-2.5 text-sm font-medium text-offwhite/90 hover:bg-white/5"
            : "text-sm font-medium text-offwhite/85 transition-colors hover:text-gold"
        }
      >
        {authText.login}
      </Link>
      <Link
        href="/register"
        onClick={onNavigate}
        className={
          mobile
            ? "block rounded-xl px-3 py-2.5 text-sm font-semibold text-gold hover:bg-white/5"
            : "rounded-xl border border-gold/60 px-4 py-1.5 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-navy"
        }
      >
        {authText.signup}
      </Link>
    </div>
  );
}