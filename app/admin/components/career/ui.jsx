"use client";

// ui.jsx — عناصر واجهة مشتركة لبانلات إدارة بوابة الكارير (نفس ستايل لوحة الأدمن).
import { useEffect } from "react";
import { X, Loader, AlertCircle } from "lucide-react";

export const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
export const btnPrimary =
  "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50";

export function Field({ label, children, className = "" }) {
  return (
    <label className={`block text-xs font-semibold text-gray-600 ${className}`}>
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal
        onMouseDown={(e) => e.stopPropagation()}
        className={`my-8 w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-white p-6 shadow-2xl`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center gap-2 py-10 text-gray-500">
      <Loader size={18} className="animate-spin" /> Loading…
    </div>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle size={16} className="mt-0.5 shrink-0" /> {message}
    </div>
  );
}

export function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

// رسائل أخطاء الـ API → نص مفهوم.
export const errText = (e) => (e?.message ? e.message.replaceAll("_", " ") : "Something went wrong");
