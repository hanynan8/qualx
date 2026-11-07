"use client";

// views/MyJobsView.jsx — "My Jobs": المهام/الوظائف اللي اتقبل فيها الشخص (تكليفات من الأدمن).
import { useCallback, useEffect, useState } from "react";
import JobCard from "../components/JobCard";
import JobDetail from "../components/JobDetail";

// رسمة الحالة الفاضية: لابتوب + مظروف + عدسة (خطوط Navy + تعبئة Gold).
function EmptyIllustration() {
  return (
    <svg viewBox="0 0 220 190" className="h-44 w-auto sm:h-52" aria-hidden fill="none">
      <rect x="20" y="62" width="180" height="104" rx="6" stroke="#0B1F3A" strokeWidth="2.5" />
      <rect x="8" y="166" width="204" height="8" rx="4" stroke="#0B1F3A" strokeWidth="2.5" />
      <path d="M62 112 110 144 158 112V158H62Z" fill="#C9A227" />
      <path d="M62 112 110 82 158 112 110 144Z" fill="#fff" stroke="#0B1F3A" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M62 158 110 124 158 158" stroke="#0B1F3A" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="82" y="34" width="56" height="64" rx="3" fill="#fff" stroke="#C9A227" strokeWidth="2.5" />
      <path d="M92 52h36M92 62h36M92 72h22" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="62" cy="38" r="22" fill="#fff" stroke="#0B1F3A" strokeWidth="2.5" />
      <circle cx="62" cy="38" r="14" stroke="#0B1F3A" strokeWidth="2" />
      <path d="m62 29 2.6 5.4 5.9.8-4.3 4.1 1 5.9L62 42.5l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8Z" fill="#C9A227" />
      <path d="m150 20 22 22" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m168 26 10-10 4 4-10 10Z" fill="#C9A227" stroke="#0B1F3A" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="190" cy="48" r="4" stroke="#C9A227" strokeWidth="2" />
      <path d="m30 78 8 2-4 8Z" stroke="#C9A227" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default function MyJobsView({ t, go }) {
  const [state, setState] = useState({ loading: true, error: false, items: [] });
  const [openJob, setOpenJob] = useState(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: false }));
    fetch("/api/career/my-jobs", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setState({ loading: false, error: false, items: d.items || [] }))
      .catch(() => setState({ loading: false, error: true, items: [] }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (openJob) {
    return (
      <JobDetail
        job={openJob}
        t={t}
        backLabel={t.nav.myJobs}
        onBack={() => setOpenJob(null)}
        statusLabel={t.status[openJob.assignment?.status]}
      />
    );
  }

  const { loading, error, items } = state;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white px-4 py-5 sm:px-8">
      <h1 className="font-display text-xl font-bold text-charcoal/85">{t.nav.myJobs}</h1>

      {loading ? (
        <div className="mt-6 space-y-4" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-md bg-charcoal/5" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-16 text-center">
          <p className="text-charcoal/70">{t.loadFailed}</p>
          <button type="button" onClick={load} className="mt-3 rounded-full bg-gold px-5 py-2 text-sm font-bold text-navy hover:bg-[#b3901f]">
            {t.retry}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center px-2 pb-10 pt-10 text-center sm:pt-16">
          <EmptyIllustration />
          <p className="mt-2 font-display text-lg font-medium text-charcoal/80 sm:text-2xl">
            {t.noJobsTitle} {t.noJobsHint}
          </p>
          <button
            type="button"
            onClick={() => go("jobList")}
            className="mt-5 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-navy shadow transition hover:bg-[#b3901f]"
          >
            {t.goToJobBoard}
          </button>
        </div>
      ) : (
        <div className="mt-5 max-w-4xl space-y-4">
          {items.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              t={t}
              distanceText="-"
              statusLabel={t.status[job.assignment?.status]}
              onView={setOpenJob}
            />
          ))}
        </div>
      )}
    </div>
  );
}
