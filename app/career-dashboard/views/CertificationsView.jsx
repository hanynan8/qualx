"use client";

// views/CertificationsView.jsx — "Training & Certifications": تدريب وشهادات اعتماد للأعضاء الجدد.
// تابات: In progress / Available / Completed. كل كارت: Start + Description + Materials.
// الإكمال بيعتمده الأدمن (PATCH progress) — الشخص بيبدأ بس.
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, BookOpen, Award, X } from "lucide-react";

const TABS = ["inProgress", "available", "completed"];

function tabOf(c) {
  if (!c.progress) return "available";
  return c.progress.status === "completed" ? "completed" : "inProgress";
}

export default function CertificationsView({ t }) {
  const [state, setState] = useState({ loading: true, error: false, items: [] });
  const [tab, setTab] = useState("available");
  const [busyId, setBusyId] = useState("");
  const [desc, setDesc] = useState(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: false }));
    fetch("/api/career/certifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setState({ loading: false, error: false, items: d.items || [] }))
      .catch(() => setState({ loading: false, error: true, items: [] }));
  }, []);
  useEffect(load, [load]);

  const groups = useMemo(() => {
    const g = { inProgress: [], available: [], completed: [] };
    state.items.forEach((c) => g[tabOf(c)].push(c));
    return g;
  }, [state.items]);

  async function start(c) {
    setBusyId(c.id);
    try {
      const r = await fetch("/api/career/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certId: c.id }),
      });
      if (r.ok) {
        load();
        setTab("inProgress");
        if (c.materialsUrl) window.open(c.materialsUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setBusyId("");
    }
  }

  const list = groups[tab];

  return (
    <div className="px-4 py-5 sm:px-8">
      <h1 className="font-display text-xl font-bold text-charcoal/85">{t.nav.certifications}</h1>
      <p className="mt-1 max-w-2xl text-sm text-charcoal/60">{t.certIntro}</p>

      <div className="mt-4 flex max-w-4xl overflow-x-auto rounded-md bg-white shadow-[0_1px_4px_rgba(11,31,58,0.14)]" role="tablist">
        {TABS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`whitespace-nowrap border-b-2 px-6 py-4 text-sm font-bold uppercase tracking-wide transition ${
              tab === k ? "border-gold text-gold" : "border-transparent text-charcoal/55 hover:text-charcoal"
            }`}
          >
            {t.certTabs[k]} ({state.loading ? "…" : groups[k].length})
          </button>
        ))}
      </div>

      {state.error ? (
        <div className="mt-6 max-w-md rounded-md bg-white p-8 text-center shadow-sm">
          <p className="text-charcoal/70">{t.loadFailed}</p>
          <button type="button" onClick={load} className="mt-3 rounded-full bg-gold px-5 py-2 text-sm font-bold text-navy hover:bg-[#b3901f]">
            {t.retry}
          </button>
        </div>
      ) : state.loading ? (
        <div className="mt-5 flex flex-wrap gap-5" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="h-52 w-64 animate-pulse rounded-md bg-white/70" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-5 max-w-4xl rounded-md bg-white p-10 text-center text-sm text-charcoal/60 shadow-sm">
          {t.certEmpty[tab]}
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-5">
          {list.map((c) => (
            <article key={c.id} className="flex w-full max-w-[17.5rem] flex-col overflow-hidden rounded-md bg-white shadow-[0_1px_4px_rgba(11,31,58,0.14)] sm:w-64">
              <div className="flex flex-1 flex-col items-center justify-between gap-5 px-4 py-8 text-center">
                <h2 className="break-words font-display text-sm font-extrabold uppercase leading-snug text-charcoal/85">{c.title}</h2>
                {tab === "completed" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-800">
                    <Award size={16} /> {t.certified}
                  </span>
                ) : tab === "inProgress" ? (
                  <span className="rounded-full bg-gold/15 px-4 py-1.5 text-sm font-bold text-[#8A6D10]">{t.certTabs.inProgress}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => start(c)}
                    disabled={busyId === c.id}
                    className="rounded-full border-2 border-emerald-600 px-10 py-1.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                  >
                    {t.start}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 divide-x divide-charcoal/10 border-t border-charcoal/10 rtl:divide-x-reverse">
                <button
                  type="button"
                  disabled={!c.description}
                  onClick={() => setDesc(c)}
                  className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-charcoal/80 transition enabled:hover:text-gold disabled:text-charcoal/25"
                >
                  <ClipboardList size={17} /> {t.description}
                </button>
                {c.materialsUrl ? (
                  <a
                    href={c.materialsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-charcoal/80 transition hover:text-gold"
                  >
                    <BookOpen size={17} /> {t.materials}
                  </a>
                ) : (
                  <span className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-charcoal/25">
                    <BookOpen size={17} /> {t.materials}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {desc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4" onClick={() => setDesc(null)}>
          <div role="dialog" aria-modal className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setDesc(null)} aria-label="Close" className="absolute end-3 top-3 text-charcoal/40 hover:text-charcoal">
              <X size={18} />
            </button>
            <h3 className="pe-6 font-display text-lg font-bold text-navy">{desc.title}</h3>
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-charcoal/80">{desc.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
