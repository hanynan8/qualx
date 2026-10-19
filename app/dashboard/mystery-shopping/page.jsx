"use client";

// app/dashboard/mystery-shopping/page.jsx
//
// داشبورد الميستري شوبنج. الدخول ليها من /solutions/mystery-shopping، والحماية
// في proxy.js + layout.jsx (أي مستخدم مسجّل دخول حاليًا — شوف lib/dashboardAccess.js).

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  ClipboardCheck,
  MapPin,
  FileText,
  TrendingUp,
  ListChecks,
  Users,
  Settings,
  ShoppingBag,
  Star,
  Building2,
  Bell,
  CalendarDays,
  Download,
  ChevronDown,
  ArrowUp,
  ArrowLeft,
  Check,
  Menu,
  X,
  Languages,
  Search,
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { MYSTERY_SERVICE_PATH } from "../../lib/dashboardAccess";
import { MOCK_DASHBOARD as D, T } from "./data";
import { Gauge, TrendChart, BranchBars, RadarChart, MiniTrend } from "./components/Charts";

const NAV = [
  { key: "dashboard", Icon: LayoutDashboard, active: true },
  { key: "visits", Icon: ClipboardList },
  { key: "evaluations", Icon: ClipboardCheck },
  { key: "branches", Icon: MapPin },
  { key: "reports", Icon: FileText },
  { key: "analytics", Icon: TrendingUp },
  { key: "actions", Icon: ListChecks },
  { key: "users", Icon: Users },
  { key: "settings", Icon: Settings },
];

const KPI_STYLE = {
  visits: { Icon: ShoppingBag, bg: "bg-sky/15", fg: "text-sky" },
  rating: { Icon: Star, bg: "bg-gold/20", fg: "text-gold" },
  branches: { Icon: Building2, bg: "bg-blue-100", fg: "text-blue-600" },
  improvement: { Icon: TrendingUp, bg: "bg-amber-100", fg: "text-amber-600" },
};

export default function MysteryShoppingDashboard() {
  const { language, changeLanguage } = useLanguage();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = T[language] || T.en;
  const rtl = language === "ar";

  const fullName = session?.user?.name || "";
  const firstName = fullName.split(" ")[0] || "";

  const months = D.trend.months[language] || D.trend.months.en;
  const branchItems = D.branches.map((b) => ({
    label: b.name[language] || b.name.en,
    score: b.score,
    highlight: b.highlight,
  }));
  const criteriaItems = D.criteria.map((c) => ({ label: t.criteria[c.key], value: c.value }));

  return (
    <div className="flex min-h-screen bg-[#F3F5F9] text-charcoal">
      {/* طباعة التقرير بس (زر Download Report) */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-print, #report-print * { visibility: visible !important; }
          #report-print { position: absolute; inset: 0; margin: 0; border: 0; box-shadow: none; }
        }
      `}</style>

      {/* ───────── Sidebar ───────── */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-navy/60 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 start-0 z-40 flex w-64 flex-col bg-navy text-offwhite transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 rtl:lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center px-5 pb-6 pt-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-gold text-gold">
            <ClipboardCheck size={28} />
          </span>
          <div className="mt-3 font-display text-xl font-bold">Qualx</div>
          <div className="text-xs text-gold">{t.brandTag}</div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {NAV.map(({ key, Icon, active }) =>
            active ? (
              <div
                key={key}
                aria-current="page"
                className="flex items-center gap-3 rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Icon size={18} />
                {t.nav[key]}
              </div>
            ) : (
              <button
                key={key}
                type="button"
                disabled
                title={t.soon}
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-4 py-2.5 text-start text-sm text-offwhite/75"
              >
                <Icon size={18} />
                {t.nav[key]}
              </button>
            )
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            href={MYSTERY_SERVICE_PATH}
            className="mb-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-offwhite/70 transition-colors hover:text-gold"
          >
            <ArrowLeft size={14} className="rtl:rotate-180" />
            {t.backToSite}
          </Link>
          <div className="flex items-center gap-3 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky text-sm font-bold uppercase text-white">
              {(firstName || "Q").charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{fullName || "—"}</div>
              <div className="text-xs text-offwhite/60">{t.user}</div>
            </div>
            <ChevronDown size={16} className="text-offwhite/60" />
          </div>
        </div>
      </aside>

      {/* ───────── Main ───────── */}
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-charcoal/10 bg-white lg:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">
                {t.welcome}
                {firstName ? `, ${firstName}` : ""}!
              </h1>
              <p className="text-sm text-charcoal/60">{t.overview}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeLanguage(rtl ? "en" : "ar")}
              className="flex h-10 items-center gap-2 rounded-xl border border-charcoal/10 bg-white px-3 text-sm font-medium text-navy"
            >
              <Languages size={16} />
              {rtl ? "EN" : "عربي"}
            </button>
            <div className="flex h-10 items-center gap-2 rounded-xl border border-charcoal/10 bg-white px-3 text-sm font-medium text-navy">
              <CalendarDays size={16} />
              <span className="whitespace-nowrap">{D.periodLabel[language]}</span>
              <ChevronDown size={14} className="text-charcoal/50" />
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-charcoal/10 bg-white text-navy"
            >
              <Bell size={16} />
            </button>
          </div>
        </header>

        {/* KPIs */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {D.kpis.map((k) => {
            const { Icon, bg, fg } = KPI_STYLE[k.key];
            return (
              <div key={k.key} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${bg} ${fg}`}>
                  <Icon size={24} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm text-charcoal/70">{t.kpi[k.key]}</div>
                  <div className="font-display text-3xl font-bold text-navy">
                    {k.value}
                    {k.suffix && <span className="text-lg font-semibold text-charcoal/60">{k.suffix}</span>}
                  </div>
                  <Delta delta={k.delta} unit={k.unit} noChange={t.kpi.noChange} compared={D.comparedTo[language]} />
                </div>
              </div>
            );
          })}
        </section>

        {/* Row 2 */}
        <section className="mt-5 grid gap-5 lg:grid-cols-12">
          <Card title={t.overallTitle} className="lg:col-span-3">
            <Gauge value={D.overall.score} label={t.excellent} />
            <div className="mt-1 text-center">
              <Delta delta={D.overall.delta} unit="%" compared={D.comparedTo[language]} center />
            </div>
          </Card>

          <Card title={t.trendTitle} className="lg:col-span-5">
            <TrendChart
              months={months}
              quality={D.trend.quality}
              rating={D.trend.rating}
              qualityLabel={t.qualityScore}
              ratingLabel={t.avgRating}
              rtl={rtl}
            />
          </Card>

          <Card title={t.branchTitle} className="lg:col-span-4">
            <BranchBars items={branchItems} rtl={rtl} />
          </Card>
        </section>

        {/* Row 3 */}
        <section className="mt-5 grid gap-5 lg:grid-cols-12">
          <Card title={t.criteriaTitle} className="lg:col-span-5">
            <RadarChart items={criteriaItems} />
          </Card>

          <Card title={t.reportTitle} className="lg:col-span-7">
            <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
              {/* معاينة التقرير (دي اللي بتتطبع) */}
              <div id="report-print" className="rounded-xl border border-charcoal/10 bg-white p-4 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold text-gold">
                      <Search size={14} />
                    </span>
                    <div className="text-sm font-bold text-navy">Qualx</div>
                  </div>
                  <div className="text-end">
                    <div className="text-xs font-bold text-navy">{t.reportName}</div>
                    <div className="text-[10px] text-charcoal/60">{D.periodLabel[language]}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-navy">{t.execSummary}</div>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-charcoal/70">{t.execText}</p>
                  </div>
                  <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-[6px] border-gold">
                    <span className="text-lg font-bold leading-none text-gold">{D.overall.score}%</span>
                    <span className="text-[9px] font-semibold text-navy">{t.excellent}</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] font-bold text-navy">{t.scoreTrend}</div>
                <MiniTrend values={D.trend.quality} months={months} rtl={rtl} />
              </div>

              {/* تحميل + محتوى التقرير */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-colors hover:bg-blue-600"
                >
                  <Download size={16} />
                  {t.download}
                </button>

                <div className="mt-5 text-sm font-semibold text-navy">{t.reportFormat}</div>
                <div className="mt-2 flex items-center gap-2 text-charcoal/70">
                  <FileText size={34} strokeWidth={1.4} />
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">PDF</span>
                </div>

                <div className="mt-4 text-sm font-semibold text-navy">{t.includes}</div>
                <ul className="mt-2 space-y-1.5">
                  {t.includesList.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-charcoal/75">
                      <Check size={13} className="shrink-0 text-blue-500" strokeWidth={3} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </section>

        <p className="mt-6 text-center text-xs text-charcoal/45">{t.sampleNote}</p>
      </div>
    </div>
  );
}

function Card({ title, className = "", children }) {
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm ${className}`}>
      <h2 className="mb-3 font-display text-sm font-bold text-navy">{title}</h2>
      {children}
    </div>
  );
}

function Delta({ delta, unit = "", noChange, compared, center }) {
  const up = delta > 0;
  return (
    <div className={`mt-0.5 flex flex-wrap items-center gap-1 text-[11px] ${center ? "justify-center" : ""}`}>
      {up ? (
        <>
          <span className="inline-flex items-center font-semibold text-emerald-600">
            <ArrowUp size={12} />
            {delta}
            {unit}
          </span>
          <span className="text-charcoal/50">{compared}</span>
        </>
      ) : (
        <span className="text-charcoal/60">— {noChange}</span>
      )}
    </div>
  );
}
