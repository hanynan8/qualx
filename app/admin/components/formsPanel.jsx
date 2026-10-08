"use client";

// app/admin/components/formsPanel.jsx
//
// Form Submissions — نفس شكل formsPanel في Edumaster: هيدر بعدّاد وزر تصدير،
// جدول (#، الاسم + التاريخ، الإيميل، التليفون، الخدمة، الرسالة، Details)، نافذة
// تفاصيل مع رد بالإيميل (mailto)، ونافذة تأكيد الحذف. بيشتغل على
// /api/admin/content (admin-only + audit log على كل حذف).

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader, AlertCircle, Inbox, Trash2, Mail, MessageCircle, FileText } from "lucide-react";
import { api, splitMeta } from "../adminUtils";

const SENDER_NAME = "Qualx";

// mailto: بيفتح برنامج الإيميل الافتراضي عند الأدمن عشان يرد على صاحب الرسالة.
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
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

export default function FormsPanel() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      setError(`Error fetching submissions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // الأحدث الأول.
  const rows = useMemo(() => {
    const ts = (d) => effectiveDate(d)?.getTime() || 0;
    return [...docs].sort((a, b) => ts(b) - ts(a));
  }, [docs]);

  async function handleDelete(id) {
    setConfirmTarget(null);
    setDeletingId(id);
    try {
      await api(`/api/admin/content?collection=form&id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => String(d._id) !== String(id)));
      setSelected((prev) => (prev && String(prev._id) === String(id) ? null : prev));
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  function exportCsv() {
    const lines = [["Date", ...KNOWN_KEYS].map(csvCell).join(",")];
    for (const d of rows) {
      lines.push([formatDate(d), ...KNOWN_KEYS.map((k) => d[k] ?? "")].map(csvCell).join(","));
    }
    // BOM عشان Excel يقرا العربي صح.
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
        <Loader className="animate-spin mx-auto text-blue-500" size={48} />
        <p className="mt-4 text-gray-400 font-medium">Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100">
      <div className="p-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-3 text-blue-900">
            <Inbox size={28} /> Form Submissions
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{rows.length}</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">Messages sent via the contact form</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-xl shadow"
        >
          <FileText size={18} /> Export CSV
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-4 px-4 py-4 rounded-xl bg-red-500 text-white flex items-center gap-3">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setConfirmTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-7 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={26} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete this message?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete the message from{" "}
              <span className="font-semibold text-gray-700">{confirmTarget.name || "this contact"}</span>. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="flex-1 font-semibold px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmTarget._id)}
                className="flex-1 flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-xl shadow bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Submission Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Name</span>
                <p className="mt-1 text-[11px] font-medium text-gray-400">{formatDate(selected)}</p>
                <p className="mt-0.5 text-gray-800 text-sm" dir="auto">{selected.name || "—"}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Email</span>
                <div className="mt-1">
                  <a
                    href={selected.email ? buildReplyUrl({ to: selected.email, name: selected.name, originalMessage: selected.message }) : undefined}
                    className={`inline-flex items-center gap-2 text-sm font-medium ${
                      selected.email ? "text-blue-600 hover:text-blue-800 hover:underline" : "text-gray-400 pointer-events-none"
                    }`}
                  >
                    <Mail size={15} /> {selected.email || "—"}
                  </a>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Phone</span>
                <p className="mt-1 text-gray-800 text-sm" dir="ltr">{selected.phone || "—"}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Service</span>
                <p className="mt-1 text-gray-800 text-sm" dir="auto">{selected.service || "—"}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Message</span>
                <p className="mt-1 text-gray-800 text-sm whitespace-pre-wrap break-words bg-gray-50 rounded-xl p-4 leading-relaxed border border-gray-100" dir="auto">
                  {selected.message || "—"}
                </p>
              </div>

              {Object.entries(splitMeta(selected).body)
                .filter(([k, v]) => !KNOWN_KEYS.includes(k) && v !== "" && v != null)
                .map(([k, v]) => (
                  <div key={k}>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{k}</span>
                    <p className="mt-1 text-gray-800 text-sm whitespace-pre-wrap break-words" dir="auto">
                      {typeof v === "object" ? JSON.stringify(v) : String(v)}
                    </p>
                  </div>
                ))}

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">ID</span>
                <p className="mt-1 text-gray-500 font-mono text-xs">{String(selected._id)}</p>
              </div>

              <div className="flex gap-3 mt-2">
                <a
                  href={selected.email ? buildReplyUrl({ to: selected.email, name: selected.name, originalMessage: selected.message }) : undefined}
                  className={`flex-1 flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-xl shadow ${
                    selected.email ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-300 text-gray-500 pointer-events-none"
                  }`}
                >
                  <MessageCircle size={18} /> Reply via Email
                </a>
                <button
                  onClick={() => setConfirmTarget(selected)}
                  disabled={deletingId === String(selected._id)}
                  className="flex-1 flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-xl shadow bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white"
                >
                  {deletingId === String(selected._id) ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  {deletingId === String(selected._id) ? "Deleting..." : "Delete Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Inbox size={48} className="mx-auto mb-3 opacity-30" />
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3 px-2 font-semibold text-gray-500">#</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-500 whitespace-nowrap">Name</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-500 whitespace-nowrap">Email</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-500 whitespace-nowrap">Phone</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-500 whitespace-nowrap">Service</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-500 w-full">Message</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-500 whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((sub, idx) => {
                  const id = String(sub._id);
                  return (
                    <tr key={id} className="border-b border-gray-50 hover:bg-blue-50/40 align-top">
                      <td className="py-3 px-2 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-2 font-medium text-gray-800 whitespace-nowrap">
                        <span className="block text-[10px] font-normal text-gray-400 mb-0.5">{formatDate(sub)}</span>
                        <span dir="auto">{sub.name || "—"}</span>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <a
                          href={sub.email ? buildReplyUrl({ to: sub.email, name: sub.name, originalMessage: sub.message }) : undefined}
                          title="Reply by email"
                          className={`inline-flex items-center gap-1.5 font-medium text-left ${
                            sub.email ? "text-blue-600 hover:text-blue-800 hover:underline" : "text-gray-400 pointer-events-none"
                          }`}
                        >
                          <Mail size={14} className="shrink-0" />
                          <span>{sub.email || "—"}</span>
                        </a>
                      </td>
                      <td className="py-3 px-2 text-gray-600 whitespace-nowrap" dir="ltr">{sub.phone || "—"}</td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        {sub.service ? (
                          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">{sub.service}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        <p
                          className="whitespace-pre-wrap break-words leading-relaxed"
                          dir="auto"
                          style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                        >
                          {sub.message || "—"}
                        </p>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelected(sub)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg whitespace-nowrap"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setConfirmTarget(sub)}
                            disabled={deletingId === id}
                            title="Delete"
                            className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 disabled:opacity-50 p-1.5 rounded-lg"
                          >
                            {deletingId === id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
      </div>
    </div>
  );
}
