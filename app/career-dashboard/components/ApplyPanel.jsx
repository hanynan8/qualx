"use client";

// components/ApplyPanel.jsx — التقديم على وظيفة من صفحة التفاصيل (التاريخ المقترح + ملاحظة).
// بيجيب حالة طلب الحساب الحالي لنفس الوظيفة، وبيعرض الفورم أو الحالة (وزر سحب لو under_review).
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function ApplyPanel({ job, t }) {
  const [app, setApp] = useState(undefined); // undefined = بيتحمّل، null = ما قدّمش
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    fetch(`/api/career/applications?jobId=${encodeURIComponent(job.id)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setApp(d.items?.[0]?.application || null))
      .catch(() => setApp(null));
  }, [job.id]);
  useEffect(load, [load]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/career/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, proposedDate: date, note }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) return setApp(d.application);
      setErr(t.applyErrors[d.error] || t.genericError);
      if (d.error === "already_applied") load();
    } catch {
      setErr(t.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    setBusy(true);
    await fetch("/api/career/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id }),
    }).catch(() => {});
    setBusy(false);
    setApp(null);
    load();
  }

  if (app === undefined || job.status === "closed") return null;
  const active = app && app.status !== "withdrawn";

  return (
    <div className="mt-8 rounded-md border border-charcoal/10 bg-[#F7F7F8] p-5">
      {active ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-navy">
            <CheckCircle2 size={18} className="text-gold" />
            {t.appStatus[app.status]}
          </p>
          {app.status === "under_review" && (
            <button
              type="button"
              onClick={withdraw}
              disabled={busy}
              className="rounded-full border border-red-700/60 px-4 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              {t.withdraw}
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <h2 className="font-display text-lg font-bold text-navy sm:col-span-2">{t.applyTitle}</h2>
          <label className="text-xs font-semibold text-charcoal/60">
            {t.proposedDate}
            <input
              type="date"
              value={date}
              min={job.firstDate || undefined}
              max={job.lastDate || undefined}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block h-10 w-full rounded-md border border-charcoal/15 bg-white px-3 text-sm text-charcoal outline-none focus:border-gold"
            />
          </label>
          <label className="text-xs font-semibold text-charcoal/60 sm:col-span-2">
            {t.applyNote}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
              className="mt-1 block w-full rounded-md border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-gold"
            />
          </label>
          {err && <p className="text-sm text-red-700 sm:col-span-2">{err}</p>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-gold px-7 py-2.5 text-sm font-bold text-navy shadow transition hover:bg-[#b3901f] disabled:opacity-50"
            >
              {busy ? t.applying : t.apply}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
