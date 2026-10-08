"use client";

// app/admin/components/auditLogsPanel.jsx
//
// سجل التدقيق (audit_logs): دخول ناجح، فشل MFA، قفل حساب، وكل تعديل/حذف
// بيعمله الأدمن من اللوحة. قراءة فقط.

import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollText, RefreshCw, Search } from "lucide-react";
import PanelFrame, { Banner, Spinner } from "./PanelFrame";
import { api } from "../adminUtils";

function tone(action = "") {
  if (/fail|lock|delete|suspend/.test(action)) return "bg-red-50 text-red-700";
  if (/success|login|reactivat|create/.test(action)) return "bg-emerald-50 text-emerald-700";
  if (/update|change|role/.test(action)) return "bg-amber-50 text-amber-700";
  return "bg-blue-50 text-blue-700";
}

function detailsText(details) {
  if (!details || typeof details !== "object" || Object.keys(details).length === 0) return "—";
  return Object.entries(details)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" · ");
}

export default function AuditLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [limit, setLimit] = useState(100);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLogs(await api(`/api/admin/audit-logs?limit=${limit}`));
    } catch (err) {
      setError(`تعذّر تحميل السجل: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.action, l.actorEmail, l.actorName, l.targetEmail, l.ip, detailsText(l.details)].some((v) =>
        String(v || "").toLowerCase().includes(q)
      )
    );
  }, [logs, query]);

  return (
    <PanelFrame
      icon={ScrollText}
      title="Audit Logs"
      subtitle="آخر الأحداث الأمنية وإجراءات الأدمن (قراءة فقط)"
      actions={
        <button onClick={load} disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-60">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      {error && <Banner type="error">{error}</Banner>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search action, actor, target, IP..." className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 outline-none" />
        </div>
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="px-4 py-3 border border-gray-300 rounded-xl bg-white">
          {[50, 100, 250, 500].map((n) => (
            <option key={n} value={n}>Last {n}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{rows.length} / {logs.length}</span>
      </div>

      {loading && logs.length === 0 ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <ScrollText size={44} className="mx-auto mb-3 opacity-50" />
          <p>مفيش أحداث مسجّلة.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-blue-50/40 transition-colors align-top">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {l.createdAt ? new Date(l.createdAt).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tone(l.action)}`} dir="ltr">{l.action}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700" dir="ltr">{l.actorEmail || l.actorName || "—"}</td>
                  <td className="px-4 py-3 text-gray-700" dir="ltr">{l.targetEmail || l.targetId || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[320px] break-words" dir="ltr">{detailsText(l.details)}</td>
                  <td className="px-4 py-3 text-gray-500" dir="ltr">{l.ip || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelFrame>
  );
}
