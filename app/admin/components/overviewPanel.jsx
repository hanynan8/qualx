"use client";

// app/admin/components/overviewPanel.jsx
//
// إحصائيات عامة (نفس نمط overviewPanel في Edumaster): بطاقات أرقام + مخططين
// أعمدة CSS بسيطين لآخر 6 شهور (تسجيلات جديدة + رسائل الزوار).

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Users, ShieldCheck, Inbox, Layers, Briefcase, UserX, RefreshCcw, TrendingUp } from "lucide-react";
import PanelFrame, { Banner, Spinner } from "./PanelFrame";
import { api } from "../adminUtils";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function TrendChart({ title, data, color }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100 p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2">
        <TrendingUp size={18} className="text-blue-500" />
        {title}
      </h3>
      <div className="flex items-end justify-between gap-3 h-40">
        {data.map((d, i) => {
          const heightPct = Math.max(4, Math.round((d.count / max) * 100));
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
              <span className="text-[11px] font-semibold text-gray-500">{d.count}</span>
              <div className={`w-full max-w-[52px] rounded-t-lg transition-all ${color}`} style={{ height: `${heightPct}%` }} />
              <span className="text-xs font-semibold text-gray-400">{MONTH_LABELS[d.month - 1]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OverviewPanel() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await api("/api/admin/stats"));
    } catch (err) {
      setError(`تعذّر تحميل الإحصائيات: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const c = stats?.counts;

  return (
    <PanelFrame
      icon={BarChart3}
      title="Overview"
      subtitle="ملخص سريع عن الموقع والحسابات ورسائل الزوار"
      actions={
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      }
    >
      {error && <Banner type="error">{error}</Banner>}
      {loading && !stats ? (
        <Spinner />
      ) : (
        c && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Registered Users" value={c.users} accent="bg-blue-50 text-blue-600" />
              <StatCard icon={ShieldCheck} label="Admins" value={c.admins} accent="bg-purple-50 text-purple-600" />
              <StatCard icon={UserX} label="Suspended Accounts" value={c.suspended} accent="bg-red-50 text-red-600" />
              <StatCard icon={Inbox} label="Messages (Total)" value={c.messagesTotal} accent="bg-emerald-50 text-emerald-600" />
              <StatCard icon={Inbox} label="Messages (Last 30 days)" value={c.messages30d} accent="bg-amber-50 text-amber-600" />
              <StatCard icon={Layers} label="Services" value={c.services} accent="bg-sky-50 text-sky-600" />
              <StatCard icon={Briefcase} label="Open Careers" value={c.careers} accent="bg-indigo-50 text-indigo-600" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TrendChart title="Visitor Messages — last 6 months" data={stats.messagesTrend} color="bg-emerald-500" />
              <TrendChart title="New Signups — last 6 months" data={stats.signupsTrend} color="bg-blue-500" />
            </div>
          </>
        )
      )}
    </PanelFrame>
  );
}
