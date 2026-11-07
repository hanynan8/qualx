"use client";

// components/JobDetail.jsx — تفاصيل وظيفة (بعد "View Job").
import { ArrowLeft, MapPin, Building2, CalendarDays, Wallet, Receipt, Globe } from "lucide-react";
import { JobLogo } from "./JobCard";

function Fact({ Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-md bg-[#F7F7F8] p-4">
      <Icon size={18} className="mt-0.5 shrink-0 text-gold" />
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">{label}</div>
        <div className="mt-1 break-words text-sm text-charcoal/85">{value || "-"}</div>
      </div>
    </div>
  );
}

export default function JobDetail({ job, t, onBack, backLabel, distanceText, statusLabel }) {
  const where = [job.city, job.address].filter(Boolean).join(" — ");
  return (
    <div className="px-4 py-6 sm:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy/70 transition hover:text-gold"
      >
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {backLabel}
      </button>

      <div className="rounded-md bg-white p-5 shadow-md sm:p-7">
        <div className="flex items-start gap-4">
          <JobLogo src={job.logoUrl} size={72} />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">{t.jobDetails}</p>
            <h1 className="mt-1 break-words font-display text-xl font-extrabold uppercase leading-snug text-navy sm:text-2xl">
              {job.title}
            </h1>
            {statusLabel && (
              <span className="mt-2 inline-block rounded-full bg-gold/15 px-3 py-0.5 text-xs font-bold text-[#8A6D10]">
                {statusLabel}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Fact Icon={Building2} label={t.client} value={job.client} />
          <Fact Icon={job.type === "web_phone" ? Globe : MapPin} label={t.location} value={where} />
          <Fact Icon={Globe} label={t.jobType} value={job.type === "web_phone" ? t.webPhoneType : t.onsite} />
          <Fact Icon={Wallet} label={t.compensation} value={job.compensation} />
          <Fact Icon={Receipt} label={t.reimbursement} value={job.reimbursement} />
          <Fact Icon={CalendarDays} label={`${t.firstDate} → ${t.lastDate}`} value={[job.firstDate, job.lastDate].filter(Boolean).join("  →  ")} />
          {distanceText && distanceText !== "-" && <Fact Icon={MapPin} label={t.distance} value={distanceText} />}
        </div>

        <h2 className="mt-8 font-display text-lg font-bold text-navy">{t.description}</h2>
        <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-charcoal/80">
          {job.description || t.noDescription}
        </p>
      </div>
    </div>
  );
}
