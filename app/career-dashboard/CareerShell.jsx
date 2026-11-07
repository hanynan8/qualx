"use client";

// app/career-dashboard/CareerShell.jsx
//
// هيكل بوابة الكارير: هيدر أبيض بخط ذهبي، سايدبار، وصفحة الهوم (بانر ترحيب،
// كروت My Jobs / Find Jobs / Get More Jobs، لوحة My Performance، Useful Information).
// الصفحة الحالية في الـ hash (#home, #myJobs …). الأقسام اللي ميزاتها لسه ما اتضافتش
// بتعرض "قريبًا".

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Home,
  Mail,
  MapPin,
  Globe,
  Phone,
  ListChecks,
  BadgeCheck,
  CreditCard,
  MessageSquare,
  AlertCircle,
  Award,
  User,
  LogOut,
  Languages,
  TrendingUp,
  Construction,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { SITE_NAME, SITE_CONTACT } from "../lib/siteConfig";
import { T } from "./i18n";
import MyJobsView from "./views/MyJobsView";
import JobBoardListView from "./views/JobBoardListView";
import JobBoardMapView from "./views/JobBoardMapView";
import WebPhoneJobsView from "./views/WebPhoneJobsView";
import MyApplicationsView from "./views/MyApplicationsView";
import CertificationsView from "./views/CertificationsView";
import MyPayView from "./views/MyPayView";

const NAV = [
  { key: "home", Icon: Home },
  { key: "myJobs", Icon: Mail },
  { key: "jobList", Icon: MapPin },
  { key: "jobMap", Icon: Globe },
  { key: "webPhone", Icon: Phone },
  { key: "applications", Icon: ListChecks },
  { key: "certifications", Icon: BadgeCheck },
  { key: "pay", Icon: CreditCard },
  { key: "chat", Icon: MessageSquare },
];

export default function CareerShell({ initialUser }) {
  const { language, changeLanguage } = useLanguage();
  const t = T[language] || T.en;
  const router = useRouter();

  const [view, setView] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [me, setMe] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (NAV.some((n) => n.key === h)) setView(h);
  }, []);

  useEffect(() => {
    let off = false;
    fetch("/api/career/me", { cache: "no-store" })
      .then((r) => {
        if (r.status === 401) {
          router.replace("/career-dashboard/login");
          return null;
        }
        return r.ok ? r.json() : Promise.reject();
      })
      .then((d) => d && !off && setMe(d))
      .catch(() => !off && setLoadError(true));
    return () => {
      off = true;
    };
  }, [router]);

  const go = useCallback((key) => {
    setView(key);
    setMenuOpen(false);
    window.history.replaceState(null, "", `#${key}`);
    window.scrollTo({ top: 0 });
  }, []);

  async function logout() {
    await fetch("/api/career/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/career-dashboard/login");
    router.refresh();
  }

  const name = me?.user?.name || initialUser?.name || "";
  const firstName = name.split(" ")[0] || "";
  const summary = me?.summary;

  return (
    <div className="min-h-screen bg-[#F1F3F7] text-charcoal">
      {/* ───────── Header ───────── */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-gold bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t.menu}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gold transition hover:bg-gold/10"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt={SITE_NAME} className="h-10 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeLanguage(language === "ar" ? "en" : "ar")}
            className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-gold"
          >
            <Languages size={14} />
            {language === "ar" ? "English" : "العربية"}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenu((v) => !v)}
              aria-label={name}
              aria-expanded={userMenu}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-white shadow transition hover:bg-[#b3901f]"
            >
              <User size={20} />
            </button>
            {userMenu && (
              <>
                <button type="button" aria-label="Close" onClick={() => setUserMenu(false)} className="fixed inset-0 z-40 cursor-default" />
                <div className="absolute end-0 top-12 z-50 w-60 rounded-xl border border-navy/10 bg-white p-2 shadow-xl">
                  <div className="px-3 py-2">
                    <div className="truncate text-sm font-semibold text-navy">{name}</div>
                    <div className="truncate text-xs text-charcoal/60" dir="ltr">
                      {me?.user?.email || initialUser?.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-charcoal transition hover:bg-offwhite"
                  >
                    <LogOut size={16} className="rtl:rotate-180" />
                    {t.logout}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ───────── Sidebar ───────── */}
        {menuOpen && (
          <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 top-16 z-20 bg-navy/50 lg:hidden" />
        )}
        <aside
          className={`fixed bottom-0 start-0 top-16 z-20 w-64 overflow-y-auto border-e border-navy/10 bg-white transition-transform duration-200 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 rtl:lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
          }`}
        >
          <nav className="py-3">
            {NAV.map(({ key, Icon }) => {
              const active = key === view;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => go(key)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-5 border-s-4 px-5 py-3.5 text-start text-sm transition-colors ${
                    active
                      ? "border-gold bg-offwhite font-bold text-navy"
                      : "border-transparent font-semibold text-navy/80 hover:bg-offwhite"
                  }`}
                >
                  <Icon size={22} className={active ? "text-gold" : "text-navy/65"} />
                  {t.nav[key]}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ───────── Main ───────── */}
        <main className="min-w-0 flex-1">
          {view === "home" ? (
            <HomeView t={t} firstName={firstName} summary={summary} loadError={loadError} go={go} />
          ) : view === "myJobs" ? (
            <MyJobsView t={t} go={go} />
          ) : view === "jobList" ? (
            <JobBoardListView t={t} go={go} />
          ) : view === "jobMap" ? (
            <JobBoardMapView t={t} language={language} />
          ) : view === "webPhone" ? (
            <WebPhoneJobsView t={t} />
          ) : view === "applications" ? (
            <MyApplicationsView t={t} go={go} />
          ) : view === "certifications" ? (
            <CertificationsView t={t} />
          ) : view === "pay" ? (
            <MyPayView t={t} language={language} />
          ) : (
            <ComingSoon t={t} title={t.nav[view]} />
          )}
        </main>
      </div>
    </div>
  );
}

/* ═════════════════════ الهوم ═════════════════════ */

function Card({ className = "", children }) {
  return <div className={`rounded-md bg-[#F7F7F8] p-5 shadow-[0_2px_6px_rgba(11,31,58,0.12)] ${className}`}>{children}</div>;
}

function HomeView({ t, firstName, summary, loadError, go }) {
  const n = (v) => (summary ? v : "…");

  return (
    <>
      {/* بانر الترحيب: Navy → Sky بأشكال هندسية (بديل الصورة الزرقاء في المرجع) */}
      <div className="relative h-36 overflow-hidden bg-navy sm:h-44">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy via-[#12355F] to-sky/70" />
        <div aria-hidden className="absolute -top-10 end-[8%] h-44 w-44 rotate-45 bg-sky/30" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
        <div aria-hidden className="absolute -bottom-10 end-[26%] h-40 w-40 bg-gold/25" style={{ clipPath: "polygon(0 0, 100% 40%, 40% 100%)" }} />
        <div aria-hidden className="absolute end-[48%] top-4 h-28 w-28 bg-white/10" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
        <h1 className="relative px-5 pt-5 font-display text-2xl font-extrabold text-white sm:px-8 sm:text-3xl">
          {t.welcome}
          {firstName ? `, ${firstName}` : ""}!
        </h1>
      </div>

      <div className="-mt-[4.5rem] grid gap-5 px-4 pb-10 sm:-mt-24 sm:px-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {/* الكروت الثلاثة */}
          <div className="rounded-md bg-white p-5 shadow-md sm:p-6">
            <div className="grid gap-5 md:grid-cols-3">
              {/* My Jobs */}
              <section>
                <h2 className="mb-3 font-display text-xl font-bold text-charcoal/80">{t.myJobs}</h2>
                <Card className="flex h-[13.5rem] items-center gap-4">
                  {summary && summary.myJobs > 0 ? (
                    <button type="button" onClick={() => go("myJobs")} className="mx-auto text-center transition hover:text-gold">
                      <div className="text-4xl font-extrabold text-navy">{summary.myJobs}</div>
                      <div className="text-sm font-semibold text-charcoal/70">{t.myJobs}</div>
                    </button>
                  ) : (
                    <>
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-charcoal/25 text-white">
                        <AlertCircle size={34} />
                      </span>
                      <div className="border-s border-charcoal/25 ps-4 text-sm">
                        <p className="font-bold text-charcoal/70">{t.noJobsTitle}</p>
                        <button type="button" onClick={() => go("jobList")} className="mt-1 text-start text-charcoal/60 hover:text-gold">
                          {t.noJobsHint}
                        </button>
                      </div>
                    </>
                  )}
                </Card>
              </section>

              {/* Find Jobs */}
              <section>
                <h2 className="mb-3 font-display text-xl font-bold text-charcoal/80">{t.findJobs}</h2>
                <Card className="flex h-[13.5rem] flex-col justify-between">
                  <div className="flex items-center gap-4">
                    <Globe size={52} className="shrink-0 text-charcoal/60" strokeWidth={1.4} />
                    <div className="border-s border-charcoal/30 ps-4">
                      <div className="text-4xl font-extrabold leading-none text-charcoal">{n(summary?.webPhoneJobs)}</div>
                      <div className="mt-1 text-sm font-bold text-charcoal/85">{t.webPhoneJobs}</div>
                      <p className="mt-1 text-xs leading-snug text-charcoal/60">{t.webPhoneHint}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => go("jobMap")}
                    className="flex items-center gap-2 border-t border-charcoal/30 pt-3 text-start text-xs font-bold text-charcoal/85 transition hover:text-gold"
                  >
                    <Globe size={14} className="text-charcoal/55" />
                    {n(summary?.allJobs)} {t.allJobs}
                  </button>
                </Card>
              </section>

              {/* Get More Jobs */}
              <section>
                <h2 className="mb-3 font-display text-xl font-bold text-charcoal/80">{t.getMoreJobs}</h2>
                <Card className="flex h-[13.5rem] flex-col justify-between">
                  <div className="flex items-center gap-4">
                    <Award size={52} className="shrink-0 text-charcoal/60" strokeWidth={1.4} />
                    <div className="border-s border-charcoal/30 ps-4">
                      <div className="text-4xl font-extrabold leading-none text-charcoal">{n(summary?.certifications)}</div>
                      <div className="mt-1 text-sm font-bold text-charcoal/85">{t.availableCerts}</div>
                      <p className="mt-1 text-xs leading-snug text-charcoal/60">{t.certsHint}</p>
                    </div>
                  </div>
                  <div className="border-t border-charcoal/30 pt-3 text-xs font-bold text-emerald-700">
                    <span className="flex items-center gap-2">
                      <User size={14} className="text-charcoal/55" />
                      {n(summary?.profileCompletion)}% {t.profileCompletion}
                    </span>
                  </div>
                </Card>
              </section>
            </div>
          </div>

          {/* Useful Information */}
          <section>
            <h2 className="mb-3 font-display text-2xl font-bold text-charcoal/80">{t.usefulInfo}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="min-h-[11rem] rounded-md bg-white p-5 shadow-md">
                <h3 className="text-center text-sm font-extrabold tracking-wide text-charcoal">{t.helpDocs}</h3>
                <p className="mt-6 text-center text-sm text-charcoal/50">{t.noHelpDocs}</p>
              </div>
              <div className="rounded-md bg-white p-5 shadow-md">
                <h3 className="text-center text-sm font-extrabold tracking-wide text-charcoal">{t.contacts}</h3>
                <dl className="mt-4 divide-y divide-charcoal/10 border-y border-charcoal/10 text-sm">
                  <ContactRow label={t.companyName} value={SITE_NAME} />
                  <ContactRow label={t.companyEmail} value={SITE_CONTACT.email} href={`mailto:${SITE_CONTACT.email}`} ltr />
                  <ContactRow label={t.companyPhone} value={SITE_CONTACT.phone} href={`tel:${SITE_CONTACT.phone.replace(/\s/g, "")}`} ltr />
                </dl>
              </div>
            </div>
          </section>
        </div>

        {/* My Performance */}
        <aside className="xl:mt-[4.25rem]">
          <div className="rounded-md bg-white p-5 shadow-md">
            <h2 className="font-display text-xl font-bold text-charcoal/80">{t.myPerformance}</h2>
            <div className="mt-4 rounded-md bg-[#F7F7F8] p-4 shadow-[0_2px_6px_rgba(11,31,58,0.12)]">
              {loadError ? (
                <p className="text-sm text-red-700">{T.en.genericError}</p>
              ) : (
                <div className="flex items-start gap-3 text-sm text-charcoal/60">
                  <TrendingUp size={20} className="mt-0.5 shrink-0 text-gold" />
                  <p>{t.noPerformance}</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function ContactRow({ label, value, href, ltr }) {
  return (
    <div className="flex items-center gap-4 py-2.5">
      <dt className="w-32 shrink-0 text-charcoal/60">{label}</dt>
      <dd className="min-w-0 flex-1 border-s border-charcoal/15 ps-4">
        {href ? (
          <a href={href} dir={ltr ? "ltr" : undefined} className="break-all text-sky underline underline-offset-2 hover:text-gold">
            {value}
          </a>
        ) : (
          <span>{value}</span>
        )}
      </dd>
    </div>
  );
}

function ComingSoon({ t, title }) {
  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
      <div className="mt-6 flex flex-col items-center rounded-md bg-white px-6 py-16 text-center shadow-md">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold">
          <Construction size={30} />
        </span>
        <p className="mt-4 font-display text-lg font-bold text-navy">{t.comingSoon}</p>
        <p className="mt-1 max-w-sm text-sm text-charcoal/60">{t.comingSoonHint}</p>
      </div>
    </div>
  );
}
