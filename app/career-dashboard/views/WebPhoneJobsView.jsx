"use client";

// views/WebPhoneJobsView.jsx — "Web and Phone Jobs": وظائف عن بُعد (type=web_phone).
// منفصلة عن وظائف الموقع (قائمة/خريطة): مفيش مسافة ولا خريطة، بس عدّاد + Sort & Filter + كروت.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Globe, SlidersHorizontal, Search, X } from "lucide-react";
import JobCard from "../components/JobCard";
import JobDetail from "../components/JobDetail";

export default function WebPhoneJobsView({ t }) {
  const [state, setState] = useState({ loading: true, error: false, items: [] });
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState(false);
  const [openJob, setOpenJob] = useState(null);
  const panelRef = useRef(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: false }));
    fetch("/api/career/jobs?type=web_phone", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setState({ loading: false, error: false, items: d.items || [] }))
      .catch(() => setState({ loading: false, error: true, items: [] }));
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    if (!panel) return;
    const onDown = (e) => panelRef.current && !panelRef.current.contains(e.target) && setPanel(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [panel]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.items.filter((j) => !q || `${j.title} ${j.client}`.toLowerCase().includes(q));
    const cmp = (a, b) => (a || "").localeCompare(b || "");
    return [...list].sort((a, b) => {
      if (sort === "ending") {
        if (!a.lastDate) return b.lastDate ? 1 : 0;
        if (!b.lastDate) return -1;
        return cmp(a.lastDate, b.lastDate);
      }
      if (sort === "title") return cmp(a.title, b.title);
      return 0; // newest = ترتيب الـ API
    });
  }, [state.items, query, sort]);

  if (openJob) {
    return <JobDetail job={openJob} t={t} backLabel={t.webPhoneTitle} onBack={() => setOpenJob(null)} showApply />;
  }

  const { loading, error } = state;
  const filtersActive = sort !== "newest" || query.trim() !== "";

  return (
    <div className="px-4 py-5 sm:px-8">
      <h1 className="font-display text-xl font-bold text-charcoal/85">{t.webPhoneTitle}</h1>

      <div className="mt-4 max-w-5xl">
        <div className="flex items-center gap-4 rounded-md bg-white px-6 py-5 shadow-[0_1px_4px_rgba(11,31,58,0.14)]">
          <Globe size={44} className="shrink-0 text-sky" strokeWidth={1.4} />
          <p className="text-sm leading-relaxed text-charcoal/75">{t.webPhoneBanner}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-charcoal/65">
            <strong className="text-base font-extrabold text-charcoal/90">{loading ? "…" : rows.length}</strong>{" "}
            {t.remoteAvailable}
          </span>

          <div className="relative" ref={panelRef}>
            <button
              type="button"
              onClick={() => setPanel((v) => !v)}
              aria-expanded={panel}
              className={`inline-flex h-9 items-center gap-2 rounded-md bg-white px-3.5 text-sm font-semibold shadow-[0_1px_3px_rgba(11,31,58,0.18)] transition hover:text-gold ${
                filtersActive ? "text-gold" : "text-charcoal/80"
              }`}
            >
              {t.sortFilter}
              <SlidersHorizontal size={15} />
            </button>
            {panel && (
              <div className="absolute end-0 top-11 z-20 w-72 rounded-lg border border-navy/10 bg-white p-4 shadow-xl">
                <div className="relative">
                  <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.searchJobs}
                    maxLength={100}
                    className="h-9 w-full rounded-md border border-charcoal/15 ps-9 pe-8 text-sm outline-none focus:border-gold"
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery("")} aria-label={t.reset} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <p className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wide text-charcoal/45">{t.sortBy}</p>
                {[
                  ["newest", t.sortNewest],
                  ["ending", t.sortEnding],
                  ["title", t.sortTitle],
                ].map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2.5 rounded px-1.5 py-1.5 text-sm hover:bg-offwhite">
                    <input type="radio" name="wp-sort" checked={sort === key} onChange={() => setSort(key)} className="accent-[#C9A227]" />
                    {label}
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSort("newest");
                    setQuery("");
                  }}
                  className="mt-3 text-xs font-semibold text-sky hover:text-gold"
                >
                  {t.reset}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {loading ? (
            [0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-md bg-white/70" />)
          ) : error ? (
            <div className="rounded-md bg-white p-8 text-center shadow-sm">
              <p className="text-charcoal/70">{t.loadFailed}</p>
              <button type="button" onClick={load} className="mt-3 rounded-full bg-gold px-5 py-2 text-sm font-bold text-navy hover:bg-[#b3901f]">
                {t.retry}
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-md bg-white p-10 text-center text-sm text-charcoal/60 shadow-sm">
              {state.items.length === 0 ? t.noRemoteJobs : t.noMatch}
            </div>
          ) : (
            rows.map((job) => (
              <JobCard key={job.id} job={job} t={t} hideDistance subtitle={job.client} onView={setOpenJob} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
