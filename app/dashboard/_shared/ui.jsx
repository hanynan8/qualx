"use client";

// app/dashboard/_shared/ui.jsx
// مكونات واجهة مشتركة (بين داشبورد الميستري شوبنج وداشبورد التدقيق): كارت، مودال، حقول، أزرار، حالات تحميل/خطأ/فاضي.

import { useEffect } from "react";
import { X, ArrowUp, ArrowDown } from "lucide-react";

export const inputCls =
  "w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/20 disabled:bg-offwhite";

export function Card({ title, right, className = "", children }) {
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm ${className}`}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-sm font-bold text-navy">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Loading({ text }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-charcoal/60">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky/30 border-t-sky" />
      {text}
    </div>
  );
}

export function ErrorBox({ message, onRetry, retryLabel }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-white px-3 py-1.5 font-semibold text-red-700 shadow-sm hover:bg-red-100">
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky/10 text-sky">
          <Icon size={26} />
        </span>
      )}
      {title && <h3 className="font-display text-lg font-bold text-navy">{title}</h3>}
      {text && <p className="mt-1 max-w-md text-sm text-charcoal/65">{text}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

const BTN = {
  primary: "bg-sky text-white hover:bg-sky/90 shadow-sm",
  secondary: "border border-charcoal/15 bg-white text-navy hover:bg-offwhite",
  danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  ghost: "text-charcoal/70 hover:bg-charcoal/5",
};

export function Btn({ variant = "primary", className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${BTN[variant]} ${className}`}
    />
  );
}

export function IconBtn({ label, danger, children, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      {...props}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        danger ? "text-red-500 hover:bg-red-50" : "text-charcoal/60 hover:bg-charcoal/5 hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}

const TONES = {
  green: "bg-emerald-50 text-emerald-700",
  sky: "bg-sky/15 text-sky",
  gray: "bg-charcoal/10 text-charcoal/70",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-700",
  gold: "bg-gold/15 text-[#8a6d0b]",
};

export function Chip({ tone = "gray", children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{children}</span>;
}

export function Field({ label, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-charcoal/70">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Modal({ title, onClose, closeLabel = "Close", wide = false, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"} sm:rounded-2xl`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
          <IconBtn label={closeLabel} onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        {children}
      </div>
    </div>
  );
}

// فرق عن الفترة السابقة. delta=null يعني مفيش مقارنة متاحة.
// invert=true: الزيادة وحشة (زي الملاحظات المفتوحة).
export function Delta({ delta, unit = "", compared, noChange, center, invert = false }) {
  const wrap = `mt-0.5 flex flex-wrap items-center gap-1 text-[11px] ${center ? "justify-center" : ""}`;
  if (delta == null) return <div className={`${wrap} text-charcoal/40`}>—</div>;
  if (delta === 0) return <div className={`${wrap} text-charcoal/60`}>— {noChange}</div>;
  const up = delta > 0;
  return (
    <div className={wrap}>
      <span className={`inline-flex items-center font-semibold ${up !== invert ? "text-emerald-600" : "text-red-500"}`}>
        {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        {Math.abs(delta)}
        {unit}
      </span>
      <span className="text-charcoal/50">{compared}</span>
    </div>
  );
}
