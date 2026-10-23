"use client";

// تقرير قابل للطباعة / الحفظ PDF + تصدير CSV. كل الأرقام من بيانات الفترة المختارة.

import { Download, Printer, FileText } from "lucide-react";
import { useApi, useMs, errMsg, qs, localDay, formatDay, monthLabel, levelStyle } from "../client";
import { Loading, ErrorBox, Empty, Btn } from "../components/ui";
import { MiniTrend } from "../components/Charts";

const CRITERIA = ["service", "cleanliness", "speed", "staff"];

export default function ReportsView() {
  const { t, language, rtl, range } = useMs();
  const dq = useApi("dashboard", { from: range.from, to: range.to, today: localDay() });
  const aq = useApi("analytics", { from: range.from, to: range.to });
  const D = dq.data;
  const A = aq.data;

  const err = dq.error || aq.error;
  if (!D || !A) {
    return err ? <ErrorBox message={errMsg(t, err)} onRetry={() => (dq.reload(), aq.reload())} retryLabel={t.c.retry} /> : <Loading text={t.c.loading} />;
  }

  const r = t.reports;
  const settings = D.settings;
  const score = D.overall.score;
  const level = D.overall.level;
  const months = D.trend.months.map((m) => monthLabel(m, language));
  const periodLabel = `${formatDay(range.from, language)} — ${formatDay(range.to, language)}`;

  // توصيات مبنية على البيانات.
  const recs = [];
  if (A.total > 0) {
    const weakest = CRITERIA.map((c) => ({ c, v: A.totals.scores[c] }))
      .filter((x) => Number.isFinite(x.v))
      .sort((a, b) => a.v - b.v)[0];
    if (weakest) recs.push(r.recWeakest(t.criteria[weakest.c], weakest.v));
    A.matrix.filter((b) => b.score < settings.goodFrom).forEach((b) => recs.push(r.recBranch(b.name, b.score)));
    if (!A.matrix.some((b) => b.score < settings.goodFrom)) recs.push(r.recAllGood);
  }

  return (
    <div>
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body * { visibility: hidden !important; }
          #report-print, #report-print * { visibility: visible !important; }
          #report-print { position: absolute; inset: 0; margin: 0; max-width: none; border: 0; box-shadow: none; }
        }
      `}</style>

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <a
          href={`/api/mystery/export${qs({ from: range.from, to: range.to })}`}
          className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-white px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-offwhite"
        >
          <Download size={16} />
          {r.csv}
        </a>
        <Btn onClick={() => window.print()} disabled={!D.hasData}>
          <Printer size={16} />
          {r.print}
        </Btn>
      </div>

      {!D.hasData ? (
        <Empty icon={FileText} text={r.none} />
      ) : (
        <div id="report-print" className="mx-auto max-w-3xl rounded-xl border border-charcoal/10 bg-white p-6 shadow-md sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-charcoal/10 pb-4">
            <div>
              <div className="font-display text-lg font-bold text-navy">{settings.orgName || "Qualx"}</div>
              <div className="text-xs text-charcoal/55">{t.brandTag}</div>
            </div>
            <div className="text-end">
              <div className="text-sm font-bold text-navy">{r.name}</div>
              <div className="text-xs text-charcoal/60">{periodLabel}</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-5">
            <div>
              <div className="text-sm font-bold text-navy">{r.execSummary}</div>
              <p className="mt-1 text-sm leading-relaxed text-charcoal/75">
                {r.exec({ score, level: level ? t.levels[level] : "", visits: D.kpis.visits.value, branches: D.kpis.branches.value, delta: D.overall.delta })}
              </p>
            </div>
            <div
              className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-[7px]"
              style={{ borderColor: level ? levelStyle[level].color : "#C9A227" }}
            >
              <span className="text-xl font-bold leading-none text-navy">{score}%</span>
              {level && <span className="mt-0.5 text-[10px] font-semibold text-charcoal/70">{t.levels[level]}</span>}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              [t.kpi.visits, D.kpis.visits.value],
              [t.kpi.rating, D.kpis.rating.value != null ? `${D.kpis.rating.value}/5` : "—"],
              [t.kpi.branches, D.kpis.branches.value],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-offwhite px-2 py-3">
                <div className="font-display text-xl font-bold text-navy">{value}</div>
                <div className="text-[11px] text-charcoal/60">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 text-sm font-bold text-navy">{r.scoreTrend}</div>
          <div className="mx-auto max-w-md">
            <MiniTrend values={D.trend.quality} months={months} rtl={rtl} />
            <div className="flex justify-between px-1 text-[10px] text-charcoal/50" dir={rtl ? "rtl" : "ltr"}>
              {months.map((m, i) => (
                <span key={`${m}${i}`}>{m}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 text-sm font-bold text-navy">{r.branchTable}</div>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="border-b border-charcoal/15 text-charcoal/60">
                <th className="py-2 text-start font-semibold">{t.analytics.branch}</th>
                <th className="py-2 text-start font-semibold">{t.analytics.visits}</th>
                {CRITERIA.map((c) => (
                  <th key={c} className="py-2 text-start font-semibold">
                    {t.criteria[c]}
                  </th>
                ))}
                <th className="py-2 text-start font-semibold">{t.analytics.overall}</th>
              </tr>
            </thead>
            <tbody>
              {A.matrix.map((b) => (
                <tr key={b.id} className="border-b border-charcoal/10">
                  <td className="py-2 font-semibold text-navy">{b.name}</td>
                  <td className="py-2">{b.visits}</td>
                  {CRITERIA.map((c) => (
                    <td key={c} className="py-2">
                      {b.scores[c] ?? "—"}
                    </td>
                  ))}
                  <td className="py-2 font-bold text-navy">{b.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {recs.length > 0 && (
            <>
              <div className="mt-6 text-sm font-bold text-navy">{r.recsTitle}</div>
              <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-charcoal/75">
                {recs.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-8 border-t border-charcoal/10 pt-3 text-[11px] text-charcoal/45">
            {r.generated} {formatDay(localDay(), language)}
          </div>
        </div>
      )}
    </div>
  );
}
