"use client";

// app/dashboard/mystery-shopping/client.js
//
// هيلبرز الواجهة: نداء الـ API، هوك تحميل البيانات، وتواريخ/فترات.
// كل التواريخ "YYYY-MM-DD" (يوم محلي عند المستخدم لما بنحسب "النهارده").

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export class ApiError extends Error {
  constructor(code, status, extra = {}) {
    super(code);
    this.code = code;
    this.status = status;
    this.extra = extra;
  }
}

export const qs = (obj = {}) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => v !== undefined && v !== null && v !== "" && p.set(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export async function api(path, { method = "GET", body, query } = {}) {
  let res;
  try {
    res = await fetch(`/api/mystery/${path}${qs(query)}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("network", 0);
  }
  if (!res.ok) {
    let j = {};
    try {
      j = await res.json();
    } catch {}
    throw new ApiError(j.error || "internal_error", res.status, j);
  }
  return res.json();
}

// بيحمّل بيانات GET ويحتفظ بآخر نتيجة أثناء إعادة التحميل.
export function useApi(path, query, enabled = true) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const key = `${path}${qs(query)}`;

  useEffect(() => {
    if (!enabled) return;
    let off = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { query })
      .then((data) => !off && setState({ data, error: null, loading: false }))
      .catch((error) => !off && setState((s) => ({ ...s, error, loading: false })));
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick, enabled]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { ...state, reload };
}

// ───────────────────────── Context ─────────────────────────
export const MsContext = createContext(null);
export const useMs = () => useContext(MsContext);

// ───────────────────────── تواريخ ─────────────────────────
const pad = (n) => String(n).padStart(2, "0");
export const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const utc = (day) => new Date(`${day}T00:00:00Z`);
export const shiftDay = (day, n) => {
  const d = utc(day);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const locale = (language) => (language === "ar" ? "ar-EG-u-nu-latn" : "en-GB");

export function formatDay(day, language, withYear = true) {
  if (!day) return "—";
  return new Intl.DateTimeFormat(locale(language), {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(utc(day));
}

export function monthLabel(key, language) {
  return new Intl.DateTimeFormat(locale(language), { month: "short", timeZone: "UTC" }).format(utc(`${key}-01`));
}

export const PRESETS = ["last30", "thisMonth", "last90", "thisYear", "custom"];

export function presetRange(preset, today = localDay()) {
  const [y, m] = today.split("-");
  switch (preset) {
    case "thisMonth":
      return { from: `${y}-${m}-01`, to: today };
    case "last90":
      return { from: shiftDay(today, -89), to: today };
    case "thisYear":
      return { from: `${y}-01-01`, to: today };
    default:
      return { from: shiftDay(today, -29), to: today };
  }
}

export const levelStyle = {
  excellent: { color: "#C9A227", chip: "bg-gold/15 text-[#8a6d0b]" },
  good: { color: "#1E9BC6", chip: "bg-sky/15 text-sky" },
  needs_work: { color: "#D64545", chip: "bg-red-50 text-red-600" },
};

// رسالة خطأ مترجمة من ApiError.
export function errMsg(t, e) {
  if (e?.status === 429) return t.errors.rate;
  if (e?.status === 401) return t.errors.unauthorized;
  return t.errors[e?.code] || t.errors.generic;
}
