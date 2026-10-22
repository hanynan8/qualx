"use client";

// app/admin/components/cvPanel.jsx
//
// CVs — طلبات التقديم اللي جت من صفحة الوظائف مع ملف PDF. جدول بالبحث، ونافذة
// تفاصيل فيها معاينة الـ PDF (iframe من نفس الدومين) وأزرار فتح/تحميل/رد بالإيميل،
// وتأكيد حذف (بيمسح الملف من التخزين كمان). كل حاجة بتمر على /api/admin/cv
// (admin-only). الملفات private: مفيش لينك عام ليها، السيرفر هو اللي بيقدّمها.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader, AlertCircle, FileUser, Trash2, Mail, Phone, Download, ExternalLink, Search, Link2, X } from "lucide-react";
import { api } from "../adminUtils";

const fileUrl = (id, download = false) => `/api/admin/cv/${encodeURIComponent(id)}${download ? "?download=1" : ""}`;

function formatDate(v) {
  const d = v ? new Date(v) : null;
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CvPanel() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/admin/cv");
      setDocs(data.docs || []);
    } catch (err) {
      setError(`Error fetching CVs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Escape بيقفل النوافذ.
  useEffect(() => {
    if (!selected && !confirmTarget) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (confirmTarget) setConfirmTarget(null);
      else setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected, confirmTarget]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => [d.name, d.email, d.phone, d.position].some((v) => (v || "").toLowerCase().includes(q)));
  }, [docs, query]);

  async function handleDelete(id) {
    setConfirmTarget(null);
    setDeletingId(id);
    setError("");
    try {
      await api(`/api/admin/cv/${encodeURIComponent(id)}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d._id !== id));
      setSelected((prev) => (prev && prev._id === id ? null : prev));
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
        <Loader className="animate-spin mx-auto text-blue-500" size={48} />
        <p className="mt-4 text-gray-400 font-medium">Loading CVs...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100">
      <div className="p-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-3 text-blue-900">
            <FileUser size={28} /> CVs
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{docs.length}</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">Job applications with an uploaded PDF CV</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, position…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete this CV?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete the application from{" "}
              <span className="font-semibold text-gray-700">{confirmTarget.name || "this applicant"}</span> and its PDF file. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmTarget(null)} className="flex-1 font-semibold px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700">
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
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-gray-800 truncate" dir="auto">{selected.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selected.position || "General application"} · {formatDate(selected.createdAt)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close" className="text-gray-400 hover:text-gray-600 shrink-0">
                <X size={24} />
              </button>
            </div>

            <div className="grid lg:grid-cols-5 gap-0 overflow-y-auto">
              <div className="lg:col-span-2 p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-gray-200">
                <Detail label="Email">
                  <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline break-all">
                    <Mail size={15} /> {selected.email}
                  </a>
                </Detail>
                <Detail label="Phone">
                  {selected.phone ? (
                    <a href={`tel:${selected.phone}`} dir="ltr" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
                      <Phone size={15} /> {selected.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </Detail>
                {selected.link && (
                  <Detail label="Profile link">
                    <a href={selected.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline break-all">
                      <Link2 size={15} /> {selected.link}
                    </a>
                  </Detail>
                )}
                <Detail label="About the applicant">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap" dir="auto">{selected.message || "—"}</p>
                </Detail>
                <Detail label="File">
                  <p className="text-sm text-gray-700 break-all" dir="auto">
                    {selected.fileName} <span className="text-gray-400">({formatSize(selected.fileSize)})</span>
                  </p>
                </Detail>

                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={fileUrl(selected._id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow"
                  >
                    <ExternalLink size={16} /> Open
                  </a>
                  <a
                    href={fileUrl(selected._id, true)}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow"
                  >
                    <Download size={16} /> Download
                  </a>
                  <button
                    onClick={() => setConfirmTarget(selected)}
                    className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>

              <div className="lg:col-span-3 bg-gray-100 min-h-[420px] lg:min-h-[560px]">
                <iframe
                  key={selected._id}
                  src={`${fileUrl(selected._id)}#view=FitH`}
                  title={`CV — ${selected.name}`}
                  className="w-full h-full min-h-[420px] lg:min-h-[560px] border-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {docs.length === 0 && !error ? (
        <div className="p-12 text-center">
          <FileUser size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-400 font-medium">No CVs received yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold">File</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((d, i) => (
                <tr key={d._id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800" dir="auto">{d.name}</p>
                    <p className="text-[11px] text-gray-400">{formatDate(d.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 break-all">{d.email}</td>
                  <td className="px-4 py-3 text-gray-600" dir="ltr">{d.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-600" dir="auto">{d.position || <span className="text-gray-400">General application</span>}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatSize(d.fileSize)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelected(d)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                        View
                      </button>
                      <a
                        href={fileUrl(d._id, true)}
                        title="Download PDF"
                        aria-label="Download PDF"
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        onClick={() => setConfirmTarget(d)}
                        disabled={deletingId === d._id}
                        title="Delete"
                        aria-label="Delete"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === d._id ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No results for “{query}”.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}
