"use client";

// components/JobCard.jsx — كارت وظيفة (لوحة الوظائف + My Jobs).
import { ClipboardList, MapPin } from "lucide-react";
import { useState } from "react";

function Meta({ label, value }) {
  return (
    <div className="min-w-0 px-4 first:ps-0 sm:border-s sm:border-charcoal/10 sm:first:border-s-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">{label}</div>
      <div className="mt-1.5 truncate text-sm text-charcoal/80">{value || "-"}</div>
    </div>
  );
}

export function JobLogo({ src, size = 64 }) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-charcoal/10 bg-white text-charcoal/25"
    >
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setBroken(true)} className="h-full w-full object-contain p-1.5" />
      ) : (
        <ClipboardList size={size * 0.42} />
      )}
    </span>
  );
}

export default function JobCard({ job, t, distanceText, onView, statusLabel, hideDistance = false, subtitle }) {
  return (
    <article className="rounded-md bg-white p-5 shadow-[0_1px_4px_rgba(11,31,58,0.14)]">
      <div className="flex items-start gap-4">
        <JobLogo src={job.logoUrl} />
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-display text-sm font-extrabold uppercase leading-snug tracking-wide text-charcoal/85 sm:text-[15px]">
            {job.title}
          </h3>
          {(subtitle || job.city || job.client) && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-charcoal/55">
              <MapPin size={13} className="shrink-0 text-charcoal/40" />
              <span className="truncate">{subtitle || [job.city, job.client].filter(Boolean).join(" · ")}</span>
            </p>
          )}
          {statusLabel && (
            <span className="mt-2 inline-block rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-bold text-[#8A6D10]">
              {statusLabel}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onView(job)}
          className="shrink-0 rounded-full border border-navy/70 px-5 py-1.5 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold hover:text-navy"
        >
          {t.viewJob}
        </button>
      </div>

      <div className={`mt-8 grid grid-cols-2 gap-y-4 ${hideDistance ? "sm:grid-cols-4" : "sm:grid-cols-5"}`}>
        <Meta label={t.compensation} value={job.compensation} />
        <Meta label={t.reimbursement} value={job.reimbursement} />
        <Meta label={t.firstDate} value={job.firstDate} />
        <Meta label={t.lastDate} value={job.lastDate} />
        {!hideDistance && <Meta label={t.distance} value={distanceText} />}
      </div>
    </article>
  );
}
