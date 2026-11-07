"use client";

// views/MyApplicationsView.jsx — "My Applications": الوظائف اللي قدّمت عليها وحالة كل طلب.
// عدّاد "under review" + Sort By (Proposed Date / Applied Date / Title) + بانل Help Documents.
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import JobCard from "../components/JobCard";
import JobDetail from "../components/JobDetail";
import HelpDocsPanel from "../components/HelpDocsPanel";

const STATUS_STYLE = {
  under_review: "bg-gold/15 text-[#8A6D10]",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-charcoal/10 text-charcoal/60",
};

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 220 190" className="h-44 w-auto sm:h-52" aria-hidden fill="none">
      <rect x="62" y="40" width="96" height="124" rx="8" stroke="#0B1F3A" strokeWidth="2.5" />
      <rect x="88" y="28" width="44" height="22" rx="6" fill="#C9A227" stroke="#0B1F3A" strokeWidth="2.5" />
      <path d="M78 76h64M78 92h64M78 108h40" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="78" y="124" width="30" height="24" rx="2" fill="#C9A227" />
      <circle cx="36" cy="80" r="22" stroke="#C9A227" strokeWidth="2.5" />
      <circle cx="36" cy="80" r="10" stroke="#C9A227" strokeWidth="2.5" />
      <path d="m36 80 34-30" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m176 70 6 76-8 8-8-8 6-76Z" fill="#fff" stroke="#0B1F3A" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function MyApplicationsView({ t, go }) {
  const [state, setState] = useState({ loading: true, error: false, items: [] });
  const [sort, setSort] = useState("proposed");
  const [openJob, setOpenJob] = useState(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: false }));
    fetch("/api/career/applications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setState({ loading: false, error: false, items: d.items || [] }))
      .catch(() => setState({ loading: false, error: true, items: [] }));
  }, []);
  useEffect(load, [load]);

  // الطلبات المسحوبة مش بتتعرض.
  const rows = useMemo(() => {
    const list = state.items.filter((j) => j.application.status !== "withdrawn");
    const cmp = (a, b) => (a || "").localeCompare(b || "");
    return [...list].sort((a, b) => {
      if (sort === "title") return cmp(a.title, b.title);
      if (sort === "applied") return cmp(b.application.appliedAt, a.application.appliedAt);
      // proposed: اللي من غير تاريخ في الآخر
      const pa = a.application.proposedDate;
      const pb = b.application.proposedDate;
      if (!pa) return pb ? 1 : 0;
      if (!pb) return -1;
      return cmp(pa, pb);
    });
  }, [state.items, sort]);

  if (openJob) {
    return (
      <JobDetail
        job={openJob}
        t={t}
        backLabel={t.nav.applications}
        onBack={() => {
          setOpenJob(null);
          load();
        }}
        statusLabel={t.appStatus[openJob.application.status]}
        showApply
      />
    );
  }

  const { loading, error } = state;
  const review = rows.filter((j) => j.application.status === "under_review").length;

  return (
    <div className="px-4 py-5 sm:px-8">
      <h1 className="font-display text-xl font-bold text-charcoal/85">{t.nav.applications}</h1>

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-charcoal/65">
              <strong className="text-base font-extrabold text-charcoal/90">{loading ? "…" : review}</strong>{" "}
              {t.underReview}
            </span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label={t.sortBy}
                className="h-10 appearance-none rounded-md bg-white ps-3 pe-8 text-sm font-bold text-charcoal/85 shadow-[0_1px_3px_rgba(11,31,58,0.18)] outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="proposed">{t.sortBy}: {t.proposedDateShort}</option>
                <option value="applied">{t.sortBy}: {t.appliedDate}</option>
                <option value="title">{t.sortBy}: {t.sortTitle}</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-charcoal/45" />
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-4" aria-busy>
              {[0, 1].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-md bg-white/70" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-6 rounded-md bg-white p-8 text-center shadow-sm">
              <p className="text-charcoal/70">{t.loadFailed}</p>
              <button type="button" onClick={load} className="mt-3 rounded-full bg-gold px-5 py-2 text-sm font-bold text-navy hover:bg-[#b3901f]">
                {t.retry}
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center px-2 pb-10 pt-10 text-center sm:pt-14">
              <EmptyIllustration />
              <p className="mt-3 font-display text-xl font-medium text-charcoal/80 sm:text-3xl">{t.noData}</p>
              <button
                type="button"
                onClick={() => go("jobList")}
                className="mt-5 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-navy shadow transition hover:bg-[#b3901f]"
              >
                {t.goToJobBoard}
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {rows.map((job) => (
                <div key={job.id}>
                  <JobCard
                    job={job}
                    t={t}
                    hideDistance
                    subtitle={[job.type === "web_phone" ? t.webPhoneType : job.city, job.client].filter(Boolean).join(" · ")}
                    onView={setOpenJob}
                  />
                  <div className="-mt-1 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-b-md border-t border-charcoal/10 bg-white px-5 py-3 text-xs shadow-[0_1px_4px_rgba(11,31,58,0.14)]">
                    <span className={`rounded-full px-3 py-0.5 font-bold ${STATUS_STYLE[job.application.status]}`}>
                      {t.appStatus[job.application.status]}
                    </span>
                    <span className="text-charcoal/60">
                      {t.proposedDateShort}: <b className="text-charcoal/85">{job.application.proposedDate || "-"}</b>
                    </span>
                    <span className="text-charcoal/60">
                      {t.appliedDate}: <b className="text-charcoal/85">{String(job.application.appliedAt || "").slice(0, 10) || "-"}</b>
                    </span>
                    {job.application.note && (
                      <span className="min-w-0 max-w-full truncate text-charcoal/60">
                        {t.applyNote}: <b className="text-charcoal/85">{job.application.note}</b>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside>
          <HelpDocsPanel t={t} />
        </aside>
      </div>
    </div>
  );
}
