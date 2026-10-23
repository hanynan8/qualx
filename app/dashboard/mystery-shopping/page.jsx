"use client";

// app/dashboard/mystery-shopping/page.jsx
//
// داشبورد الميستري شوبنج (حقيقية): كل صفحة جوه بتقرا وتكتب على /api/mystery/*.
// الدخول من /solutions/mystery-shopping، والحماية في proxy.js + layout.jsx
// (شوف lib/dashboardAccess.js). الصفحة الحالية محفوظة في الـ hash (#visits…).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Settings,
  CalendarDays,
  ChevronDown,
  ArrowLeft,
  Menu,
  X,
  Languages,
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { MYSTERY_SERVICE_PATH } from "../../lib/dashboardAccess";
import { T } from "./i18n";
import { MsContext, PRESETS, presetRange, useApi, setActingAs } from "./client";
import DashboardView from "./views/DashboardView";
import VisitsView from "./views/VisitsView";
import BranchesView from "./views/BranchesView";
import AnalyticsView from "./views/AnalyticsView";
import ActionsView from "./views/ActionsView";
import ReportsView from "./views/ReportsView";
import SettingsView from "./views/SettingsView";

const NAV = [
  { key: "dashboard", Icon: LayoutDashboard, View: DashboardView, period: true },
  { key: "visits", Icon: ClipboardList, View: VisitsView },
  { key: "branches", Icon: MapPin, View: BranchesView },
  { key: "analytics", Icon: TrendingUp, View: AnalyticsView, period: true },
  { key: "actions", Icon: ListChecks, View: ActionsView },
  { key: "reports", Icon: FileText, View: ReportsView, period: true },
  { key: "settings", Icon: Settings, View: SettingsView },
];

export default function MysteryShoppingDashboard() {
  const { language, changeLanguage } = useLanguage();
  const { data: session } = useSession();
  const t = T[language] || T.en;
  const rtl = language === "ar";

  const [view, setView] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [preset, setPreset] = useState("last30");
  // التواريخ بتتحسب في المتصفح بس (عشان منع hydration mismatch على اليوم المحلي).
  const [range, setRange] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // 👤 الأدمن يقدر يختار عميل ويدير بياناته (الزيارات/الفروع/الإجراءات...). الـ API
  // بيرفض ?as لأي حد مش أدمن، فالاختيار ده مش بيدي صلاحية لحد غيره.
  const isAdmin = session?.user?.role === "admin";
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  setActingAs(isAdmin ? clientId : "");

  useEffect(() => {
    setRange(presetRange("last30"));
    const h = window.location.hash.slice(1);
    if (NAV.some((n) => n.key === h)) setView(h);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let off = false;
    fetch("/api/admin/users", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => !off && setClients(Array.isArray(list) ? list.filter((u) => u.role !== "admin" && u.status !== "suspended") : []))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [isAdmin]);

  const go = useCallback((key) => {
    setView(key);
    setMenuOpen(false);
    window.history.replaceState(null, "", `#${key}`);
    window.scrollTo({ top: 0 });
  }, []);

  const notify = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // الفروع مشتركة بين الزيارات والإجراءات والفروع نفسها.
  const bq = useApi("branches"); // المفتاح بيشمل ?as تلقائيًا عند اختيار عميل (أدمن)
  const branches = useMemo(() => bq.data?.items || [], [bq.data]);
  const branchName = useCallback((id) => branches.find((b) => b.id === id)?.name || "—", [branches]);

  const ctx = {
    t,
    language,
    rtl,
    range,
    go,
    notify,
    branches,
    branchesLoading: bq.loading,
    branchesError: bq.error,
    reloadBranches: bq.reload,
    branchName,
  };

  const current = NAV.find((n) => n.key === view) || NAV[0];
  const View = current.View;

  const fullName = session?.user?.name || "";
  const firstName = fullName.split(" ")[0] || "";
  const email = session?.user?.email || "";

  const pickPreset = (p) => {
    setPreset(p);
    if (p !== "custom") setRange(presetRange(p));
  };
  const setFrom = (v) => v && setRange((r) => (v <= r.to ? { ...r, from: v } : r));
  const setTo = (v) => v && setRange((r) => (v >= r.from ? { ...r, to: v } : r));

  const title = view === "dashboard" ? `${t.welcome}${firstName ? `, ${firstName}` : ""}!` : t.nav[view];
  const subtitle = view === "dashboard" ? t.overview : t.subtitles[view];

  return (
    <div className="flex min-h-screen bg-[#F3F5F9] text-charcoal">
      {/* ───────── Sidebar ───────── */}
      {menuOpen && (
        <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-navy/60 lg:hidden" />
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
          <div className="mt-3 font-display text-xl font-bold">Merilex</div>
          <div className="text-xs text-gold">{t.brandTag}</div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {NAV.map(({ key, Icon }) => {
            const active = key === view;
            return (
              <button
                key={key}
                type="button"
                onClick={() => go(key)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-start text-sm transition-colors ${
                  active ? "bg-sky font-semibold text-white" : "text-offwhite/75 hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
                {t.nav[key]}
              </button>
            );
          })}
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
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky text-sm font-bold uppercase text-white">
              {(firstName || "Q").charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{fullName || "—"}</div>
              <div className="truncate text-xs text-offwhite/60">{email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ───────── Main ───────── */}
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
              <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">{title}</h1>
              <p className="text-sm text-charcoal/60">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {current.period && range && (
              <>
                <div className="relative">
                  <CalendarDays size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-navy" />
                  <select
                    value={preset}
                    onChange={(e) => pickPreset(e.target.value)}
                    aria-label="Period"
                    className="h-10 appearance-none rounded-xl border border-charcoal/10 bg-white ps-9 pe-8 text-sm font-medium text-navy outline-none focus:border-sky"
                  >
                    {PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {t.presets[p]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-charcoal/50" />
                </div>
                {preset === "custom" && (
                  <div className="flex items-center gap-1.5 text-sm text-charcoal/60">
                    <input
                      type="date"
                      aria-label={t.from}
                      value={range.from}
                      max={range.to}
                      onChange={(e) => setFrom(e.target.value)}
                      className="h-10 rounded-xl border border-charcoal/10 bg-white px-2 text-sm text-navy outline-none focus:border-sky"
                    />
                    <span>→</span>
                    <input
                      type="date"
                      aria-label={t.to}
                      value={range.to}
                      min={range.from}
                      onChange={(e) => setTo(e.target.value)}
                      className="h-10 rounded-xl border border-charcoal/10 bg-white px-2 text-sm text-navy outline-none focus:border-sky"
                    />
                  </div>
                )}
              </>
            )}
            {isAdmin && (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                aria-label={t.adminClient}
                className="h-10 max-w-[220px] rounded-xl border border-gold/60 bg-white px-3 text-sm font-medium text-navy outline-none focus:border-sky"
              >
                <option value="">{t.adminOwn}</option>
                {clients.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => changeLanguage(rtl ? "en" : "ar")}
              className="flex h-10 items-center gap-2 rounded-xl border border-charcoal/10 bg-white px-3 text-sm font-medium text-navy"
            >
              <Languages size={16} />
              {rtl ? "EN" : "عربي"}
            </button>
          </div>
        </header>

        {/* تابات ظاهرة على الشاشات الصغيرة (السايدبار بيتخبّى تحت lg) */}
        <nav aria-label="Sections" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden">
          {NAV.map(({ key, Icon }) => {
            const active = key === view;
            return (
              <button
                key={key}
                type="button"
                onClick={() => go(key)}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-navy text-white" : "bg-white text-charcoal/70 shadow-sm hover:bg-sky/10"
                }`}
              >
                <Icon size={16} />
                {t.nav[key]}
              </button>
            );
          })}
        </nav>

        {isAdmin && clientId && (
          <div className="mb-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm text-[#6b5409]">{t.adminActing}</div>
        )}

        <MsContext.Provider value={ctx}>{(!current.period || range) && <View key={`${view}:${clientId}`} />}</MsContext.Provider>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 start-1/2 z-[60] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg rtl:translate-x-1/2 ${
            toast.type === "error" ? "bg-red-600" : "bg-navy"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
