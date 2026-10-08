"use client";

// app/admin/components/formsPanel.jsx
//
// رسائل الزوار (كولكشن form) — نفس منطق formsPanel في Edumaster: جدول، بحث،
// نافذة تفاصيل، رد بالإيميل (mailto)، حذف بنافذة تأكيد، وتصدير. بيشتغل على
// /api/admin/content (admin-only + audit log على كل حذف).

import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Trash2, Mail, FileText, Search, Download, RefreshCw, X, Eye } from "lucide-react";
import PanelFrame, { Banner, Spinner } from "./PanelFrame";
import { api, splitMeta } from "../adminUtils";

const SENDER_NAME = "Qualx";

function buildReplyUrl({ to, name, originalMessage }) {
  const subject = `Reply to your inquiry - ${SENDER_NAME}`;
  const greeting = name ? `Hello ${name},` : "Hello,";
  const quoted = originalMessage ? `\n\n----- Your original message -----\n${originalMessage}\n` : "";
  const body = `${greeting}\n\nThank you for contacting ${SENDER_NAME}.\n${quoted}`;
  return `mailto:${to || ""}?${new URLSearchParams({ subject, body }).toString()}`;
}

// تاريخ الإنشاء: createdAt لو موجود، وإلا من الـ ObjectId نفسه (للـ documents القديمة).
function getDateFromObjectId(id) {
  if (!id || typeof id !== "string" || id.length < 8) return null;
  const hex = id.substring(0, 8);
  if (!/^[0-9a-fA-F]{8}$/.test(hex)) return null;
  const d = new Date(parseInt(hex, 16) * 1000);
  return isNaN(d.getTime()) ? null : d;
}

function effectiveDate(doc) {
  const d = doc?.createdAt ? new Date(doc.createdAt) : null;
  if (d && !isNaN(d.getTime())) return d;
  return getDateFromObjectId(String(doc?._id || ""));
}

function formatDate(doc) {
  const d = effectiveDate(doc);
  if (!d) return "—";
  return d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const KNOWN_KEYS = ["name", "email", "phone", "service", "message"];

function csvCell(v) {
  const s = String(v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export default function FormsPanel() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);
  const [selected, setSelected] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/admin/content?collection=form");
      setDocs(data.docs || []);
    } catch (err) {
      setError(`تعذّر تحميل الرسائل: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? docs.filter((d) => KNOWN_KEYS.some((k) => String(d[k] ?? "").toLowerCase().includes(q)))
      : docs;
    const ts = (d) => effectiveDate(d)?.getTime() || 0;
    return [...filtered].sort((a, b) => (newestFirst ? ts(b) - ts(a) : ts(a) - ts(b)));
  }, [docs, query, newestFirst]);

  async function handleDelete(id) {
    setConfirmTarget(null);
    setDeletingId(id);
    try {
      await api(`/api/admin/content?collection=form&id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => String(d._id) !== String(id)));
      setSelected((prev) => (prev && String(prev._id) === String(id) ? null : prev));
    } catch (err) {
      setError(`فشل الحذف: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  function exportCsv() {
    const header = ["Date", ...KNOWN_KEYS];
    const lines = [header.map(csvCell).join(",")];
    for (const d of rows) {
      lines.push([formatDate(d), ...KNOWN_KEYS.map((k) => d[k] ?? "")].map(csvCell).join(","));
    }
    // BOM عشان Excel يقرا العربي صح.
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `messages-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <PanelFrame
      icon={Inbox}
      title="Form Submissions"
      subtitle="رسائل فورم التواصل (كولكشن form)"
      actions={
        <>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-60">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={exportCsv} disabled={rows.length === 0} className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium disabled:opacity-50">
            <Download size={18} /> Export CSV
          </button>
        </>
      }
    >
      {error && <Banner type="error">{error}</Banner>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, service, message..."
            className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={newestFirst ? "new" : "old"}
          onChange={(e) => setNewestFirst(e.target.value === "new")}
          className="px-4 py-3 border border-gray-300 rounded-xl bg-white"
        >
          <option value="new">Newest first</option>
          <option value="old">Oldest first</option>
        </select>
        <span className="text-sm text-gray-500">{rows.length} / {docs.length}</span>
      </div>

      {loading && docs.length === 0 ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Inbox size={44} className="mx-auto mb-3 opacity-50" />
          <p>لا توجد رسائل.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((d, i) => {
                const id = String(d._id);
                return (
                  <tr key={id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800" dir="auto">{d.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-600" dir="ltr">{d.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-600" dir="ltr">{d.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-600" dir="auto">{d.service || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[260px] truncate" dir="auto">{d.message || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(d)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button title="View" onClick={() => setSelected(d)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                          <Eye size={16} />
                        </button>
                        {d.email && (
                          <a title="Reply by email" href={buildReplyUrl({ to: d.email, name: d.name, originalMessage: d.message })} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                            <Mail size={16} />
                          </a>
                        )}
                        <button title="Delete" disabled={deletingId === id} onClick={() => setConfirmTarget(d)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* نافذة التفاصيل */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
              <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2"><FileText size={20} /> Message Details</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/70"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {KNOWN_KEYS.map((k) => (
                <div key={k}>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">{k}</p>
                  <p className="whitespace-pre-wrap rounded-xl bg-gray-50 px-4 py-3 text-gray-800" dir="auto">{selected[k] || "—"}</p>
                </div>
              ))}
              {Object.entries(splitMeta(selected).body)
                .filter(([k, v]) => !KNOWN_KEYS.includes(k) && v !== "" && v != null)
                .map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs font-semibold uppercase text-gray-400 mb-1">{k}</p>
                    <p className="whitespace-pre-wrap rounded-xl bg-gray-50 px-4 py-3 text-gray-800" dir="auto">
                      {typeof v === "object" ? JSON.stringify(v) : String(v)}
                    </p>
                  </div>
                ))}
              <p className="text-xs text-gray-400">Received: {formatDate(selected)}</p>
              <div className="flex gap-3 pt-2">
                {selected.email && (
                  <a href={buildReplyUrl({ to: selected.email, name: selected.name, originalMessage: selected.message })} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700">
                    <Mail size={16} /> Reply
                  </a>
                )}
                <button onClick={() => setConfirmTarget(selected)} className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-xl hover:bg-red-100">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {confirmTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmTarget(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 size={26} /></div>
            <h3 className="text-center text-lg font-semibold text-gray-800">Delete this message?</h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              رسالة <strong dir="auto">{confirmTarget.name || confirmTarget.email || "—"}</strong> هتتمسح نهائيًا من الداتابيز.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmTarget(null)} className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(confirmTarget._id)} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </PanelFrame>
  );
}
