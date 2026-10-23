"use client";

// تقرير قابل للطباعة / الحفظ PDF + تحميل CSV (الزيارات والملاحظات). كل الأرقام من بيانات الفترة المختارة.

import { Download, Printer, FileText } from "lucide-react";
import { useApi, useAu, errMsg, qs, asQuery, localDay, formatDay, monthLabel, levelStyle, severityStyle, AREAS } from "../client";
import { Loading, ErrorBox, Empty, Btn, Chip } from "../../_shared/ui";
import { MiniTrend } from "../../_shared/Charts";
import { AreaBars } from "../components/AuditCharts";

const OPEN_SHOWN = 15;
const levelOf = (score, s) => (score == null ? null : score >= s.compliantFrom ? "compliant" : score >= s.partialFrom ? "partial" : "non_compliant");

const csvBtn =
  "inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-white px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-offwhite";

export default function ReportsView() {
  const { t, language, rtl, range, branchName } = useAu();
  const today = localDay();
  const dq = useApi("dashboard", { from: range.from, to: range.to, today });
  const aq = useApi("analytics", { from: range.from, to: range.to, today });
  // الأخطر والأقدم الأول، والمقفولة في الآخر — فأول ١٠٠ فيهم المفتوحة.
  const fq = useApi("findings", { limit: 100, today });
  const D = dq.data;
  const A = aq.data;
  const FD = fq.data;

  const err = dq.error || aq.error || fq.error;
  if (!D || !A || !FD) {
    return err ? (
      <ErrorBox message={errMsg(t, err)} onRetry={() => (dq.reload(), aq.reload(), fq.reload())} retryLabel={t.c.retry} />
    ) : (
      <Loading text={t.c.loading} />
    );
  }

  const r = t.reports;
  const settings = D.settings;
  const score = D.overall.score;
  const level = D.overall.level;
  const months = D.trend.months.map((m) => monthLabel(m, language));
  const periodLabel = `${formatDay(range.from, language)} — ${formatDay(range.to, language)}`;
  const openAll = FD.items.filter((f) => f.status !== "closed");
  const openShown = openAll.slice(0, OPEN_SHOWN);
  const openTotal = D.kpis.openFindings.value;
  const areaColor = (v) => levelStyle[levelOf(v, settings)]?.color || "#C9A227";

  // توصيات مبنية على بيانات الفترة.
  const recs = [];
  if (A.total > 0) {
    const weakest = A.highlights.weakestArea;
    if (weakest) recs.push(r.recWeakest(t.areas[weakest.key], weakest.value));
    const low = A.matrix.filter((b) => b.score < settings.partialFrom);
    low.forEach((b) => recs.push(r.recBranch(b.name, b.score)));
    if (D.alerts.criticalOpen > 0) recs.push(r.recCritical(D.alerts.criticalOpen));
    if (D.alerts.overdueFindings > 0) recs.push(r.recOverdue(D.alerts.overdueFindings));
    const top = A.topFailures[0];
    if (top && top.count >= 2) recs.push(r.recRecurring(top.item, top.count));
    if (!low.length) recs.push(r.recAllGood);
  }

  const exportHref = (type) => `/api/audit/export${qs({ type, from: range.from, to: range.to, ...asQuery() })}`;
  const th = "py-2 text-start font-semibold";

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
        <a href={exportHref("visits")} className={csvBtn}>
          <Download size={16} />
          {r.csvVisits}
        </a>
        <a href={exportHref("findings")} className={csvBtn}>
          <Download size={16} />
          {r.csvFindings}
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
              <div className="font-display text-lg font-bold text-navy">{settings.orgName || "Merilex"}</div>
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
                {r.exec({
                  score,
                  level: level ? t.levels[level] : "",
                  visits: D.kpis.audits.value,
                  branches: D.kpis.branches.value,
                  openFindings: openTotal,
                  delta: D.overall.delta,
                })}
              </p>
            </div>
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-[7px]" style={{ borderColor: level ? levelStyle[level].color : "#C9A227" }}>
              <span className="text-xl font-bold leading-none text-navy">{score}%</span>
              {level && <span className="mt-0.5 px-1 text-center text-[10px] font-semibold leading-tight text-charcoal/70">{t.levels[level]}</span>}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              [t.kpi.audits, D.kpis.audits.value],
              [t.kpi.branches, D.kpis.branches.value],
              [t.kpi.openFindings, openTotal],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-offwhite px-2 py-3">
                <div className="font-display text-xl font-bold text-navy">{value}</div>
                <div className="text-[11px] text-charcoal/60">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 text-sm font-bold text-navy">{r.scoreTrend}</div>
          <div className="mx-auto max-w-md">
            <MiniTrend values={D.trend.compliance} months={months} rtl={rtl} />
            <div className="flex justify-between px-1 text-[10px] text-charcoal/50" dir={rtl ? "rtl" : "ltr"}>
              {months.map((m, i) => (
                <span key={`${m}${i}`}>{m}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 text-sm font-bold text-navy">{r.areaTable}</div>
          <div className="mt-3">
            <AreaBars
              items={D.areas.map((a) => ({ key: a.key, label: t.areas[a.key], value: a.value, sub: t.fails(a.fails) }))}
              colorOf={areaColor}
            />
          </div>

          <div className="mt-6 text-sm font-bold text-navy">{r.branchTable}</div>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="border-b border-charcoal/15 text-charcoal/60">
                <th className={th}>{t.analytics.branch}</th>
                <th className={th}>{t.analytics.audits}</th>
                {AREAS.map((k) => (
                  <th key={k} className={th}>
                    {t.areas[k]}
                  </th>
                ))}
                <th className={th}>{t.analytics.overall}</th>
              </tr>
            </thead>
            <tbody>
              {A.matrix.map((b) => (
                <tr key={b.id} className="border-b border-charcoal/10">
                  <td className="py-2 font-semibold text-navy">{b.name}</td>
                  <td className="py-2">{b.audits}</td>
                  {AREAS.map((k) => (
                    <td key={k} className="py-2">
                      {b.scores[k] != null ? `${b.scores[k]}%` : "—"}
                    </td>
                  ))}
                  <td className="py-2 font-bold text-navy">{b.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {A.topFailures.length > 0 && (
            <>
              <div className="mt-6 text-sm font-bold text-navy">{r.topFailures}</div>
              <table className="mt-2 w-full text-xs">
                <thead>
                  <tr className="border-b border-charcoal/15 text-charcoal/60">
                    <th className={th}>{r.colItem}</th>
                    <th className={th}>{r.colArea}</th>
                    <th className={th}>{r.colTimes}</th>
                  </tr>
                </thead>
                <tbody>
                  {A.topFailures.slice(0, 5).map((f) => (
                    <tr key={`${f.area}${f.item}`} className="border-b border-charcoal/10">
                      <td className="py-2 font-semibold text-navy">{f.item}</td>
                      <td className="py-2">{t.areas[f.area] || f.area}</td>
                      <td className="py-2">{f.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="mt-6 text-sm font-bold text-navy">{r.openTitle}</div>
          {openShown.length === 0 ? (
            <p className="mt-2 text-sm text-charcoal/60">{r.noOpen}</p>
          ) : (
            <>
              <table className="mt-2 w-full text-xs">
                <thead>
                  <tr className="border-b border-charcoal/15 text-charcoal/60">
                    <th className={th}>{t.findings.title}</th>
                    <th className={th}>{r.colBranch}</th>
                    <th className={th}>{r.colSeverity}</th>
                    <th className={th}>{r.colDue}</th>
                    <th className={th}>{r.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {openShown.map((f) => {
                    const late = f.dueDate && f.dueDate < today;
                    return (
                      <tr key={f.id} className="border-b border-charcoal/10 align-top">
                        <td className="py-2 pe-2 font-semibold text-navy">{f.title}</td>
                        <td className="py-2 pe-2">{f.branchId ? branchName(f.branchId) : "—"}</td>
                        <td className="py-2 pe-2">
                          <Chip tone={severityStyle[f.severity].tone}>{t.severities[f.severity]}</Chip>
                        </td>
                        <td className={`whitespace-nowrap py-2 pe-2 ${late ? "font-semibold text-red-600" : ""}`}>{f.dueDate ? formatDay(f.dueDate, language) : "—"}</td>
                        <td className="py-2">{t.findings.statuses[f.status]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {openTotal > openShown.length && <p className="mt-2 text-xs text-charcoal/55">{r.moreOpen(openTotal - openShown.length)}</p>}
            </>
          )}

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
            {r.generated} {formatDay(today, language)}
          </div>
        </div>
      )}
    </div>
  );
}
