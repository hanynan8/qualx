"use client";

// تحليلات أعمق: مصفوفة فرع × مجال بألوان حرارية، توزيع النتايج، نشاط المدقّقين، أكتر البنود فشلًا،
// اتجاه كل مجال على ٦ شهور، إدارة الملاحظات، وأبرز النقاط. كله من /api/audit/analytics.

import { TrendingUp } from "lucide-react";
import { useApi, useAu, errMsg, localDay, monthLabel, levelStyle, AREAS } from "../client";
import { Card, Loading, ErrorBox, Empty, Chip } from "../../_shared/ui";
import { MiniTrend } from "../../_shared/Charts";
import { SegmentBar } from "../components/AuditCharts";

// لون الخلية: أحمر (٥٠٪ أو أقل) → أخضر (١٠٠٪).
const heat = (v) => (Number.isFinite(v) ? { background: `hsl(${Math.max(0, Math.min(1, (v - 50) / 50)) * 120}, 60%, 90%)` } : undefined);
const th = "px-3 py-3 text-start font-semibold";

export default function AnalyticsView() {
  const { t, language, rtl, range } = useAu();
  const { data: A, error, loading, reload } = useApi("analytics", { from: range.from, to: range.to, today: localDay() });

  if (!A) return error ? <ErrorBox message={errMsg(t, error)} onRetry={reload} retryLabel={t.c.retry} /> : <Loading text={t.c.loading} />;
  if (A.total === 0) return <Empty icon={TrendingUp} text={t.analytics.none} />;

  const a = t.analytics;
  const H = A.highlights;
  const months = A.areaTrend.months.map((m) => monthLabel(m, language));
  const F = A.findings;
  const agingMax = Math.max(1, ...Object.values(F.aging));

  const highlights = [
    H.best && [a.hBest, `${H.best.name} · ${H.best.score}%`],
    H.lowest && [a.hLowest, `${H.lowest.name} · ${H.lowest.score}%`],
    H.strongestArea && [a.hStrongest, `${t.areas[H.strongestArea.key]} · ${H.strongestArea.value}%`],
    H.weakestArea && [a.hWeakest, `${t.areas[H.weakestArea.key]} · ${H.weakestArea.value}%`],
    H.improved && [a.hImproved, `${H.improved.name} · ${a.pts(H.improved.delta)}`],
    H.topFailure && [a.hTopFailure, `${H.topFailure.item} · ${a.times(H.topFailure.count)}`],
  ].filter(Boolean);

  const segments = A.levels.map((l) => ({ key: l.key, label: t.levels[l.key], value: l.count, color: levelStyle[l.key].color }));

  return (
    <div className={`space-y-5 ${loading ? "opacity-60" : ""}`}>
      {highlights.length > 0 && (
        <Card title={a.highlightsTitle}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-offwhite px-4 py-3">
                <div className="text-xs text-charcoal/60">{label}</div>
                <div className="mt-0.5 text-sm font-bold text-navy">{value}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title={a.matrixTitle}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs text-charcoal/60">
                <th className={th}>{a.branch}</th>
                <th className={th}>{a.audits}</th>
                {AREAS.map((k) => (
                  <th key={k} className={th}>
                    {t.areas[k]}
                  </th>
                ))}
                <th className={th}>{a.overall}</th>
                <th className={th}>{a.fails}</th>
              </tr>
            </thead>
            <tbody>
              {A.matrix.map((r) => (
                <tr key={r.id} className="border-b border-charcoal/5">
                  <td className="px-3 py-2.5 font-semibold text-navy">{r.name}</td>
                  <td className="px-3 py-2.5 text-charcoal/70">{r.audits}</td>
                  {AREAS.map((k) => (
                    <td key={k} className="px-3 py-2.5">
                      <span className="inline-block min-w-[3rem] rounded-md px-2 py-1 text-center font-semibold text-navy" style={heat(r.scores[k])}>
                        {r.scores[k] != null ? `${r.scores[k]}%` : "—"}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-2.5 font-bold text-navy">{r.score}%</td>
                  <td className="px-3 py-2.5 text-charcoal/70">{r.fails}</td>
                </tr>
              ))}
              <tr className="bg-offwhite">
                <td className="px-3 py-2.5 font-bold text-navy">{a.totals}</td>
                <td className="px-3 py-2.5 text-charcoal/70">{A.totals.audits}</td>
                {AREAS.map((k) => (
                  <td key={k} className="px-3 py-2.5 font-semibold text-navy">
                    {A.totals.scores[k] != null ? `${A.totals.scores[k]}%` : "—"}
                  </td>
                ))}
                <td className="px-3 py-2.5 font-bold text-navy">{A.totals.score}%</td>
                <td className="px-3 py-2.5 text-charcoal/70">{A.totals.fails}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={a.levelsTitle}>
          <SegmentBar segments={segments} />
        </Card>

        <Card title={a.auditorsTitle}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 text-xs text-charcoal/60">
                  <th className={th}>{a.auditor}</th>
                  <th className={th}>{a.audits}</th>
                  <th className={th}>{a.avg}</th>
                </tr>
              </thead>
              <tbody>
                {A.auditors.map((e, i) => (
                  <tr key={`${e.name}${i}`} className="border-b border-charcoal/5 last:border-0">
                    <td className="px-3 py-2.5 font-semibold text-navy">{e.name || a.unnamed}</td>
                    <td className="px-3 py-2.5 text-charcoal/70">{e.audits}</td>
                    <td className="px-3 py-2.5 text-charcoal/80">{e.avg != null ? `${e.avg}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title={a.topFailuresTitle}>
        <p className="-mt-1 mb-3 text-xs text-charcoal/55">{a.topFailuresHint}</p>
        {A.topFailures.length === 0 ? (
          <p className="py-4 text-center text-sm text-charcoal/60">{a.noFailures}</p>
        ) : (
          <ol className="divide-y divide-charcoal/5">
            {A.topFailures.map((f, i) => (
              <li key={`${f.area}${f.item}`} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy">{i + 1}</span>
                <span className="min-w-0 flex-1 font-medium text-navy">{f.item}</span>
                <Chip tone="gray">{t.areas[f.area] || f.area}</Chip>
                <span className="text-xs text-charcoal/60">{a.inBranches(f.branches)}</span>
                <Chip tone="red">{a.times(f.count)}</Chip>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title={a.areaTrendTitle}>
        <div className="grid gap-5 sm:grid-cols-2">
          {AREAS.map((k) => (
            <div key={k}>
              <div className="mb-1 text-sm font-semibold text-navy">{t.areas[k]}</div>
              <MiniTrend values={A.areaTrend.series[k]} months={months} rtl={rtl} />
              <div className="flex justify-between px-1 text-[10px] text-charcoal/50" dir={rtl ? "rtl" : "ltr"}>
                {months.map((m, i) => (
                  <span key={`${m}${i}`}>{m}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={a.findingsTitle}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [a.openedInPeriod, F.openedInPeriod],
            [a.closedInPeriod, F.closedInPeriod],
            [a.avgClose, F.avgCloseDays != null ? a.days(F.avgCloseDays) : "—"],
            [a.slaRate, F.slaRate != null ? `${F.slaRate}%` : "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-offwhite px-3 py-3 text-center">
              <div className="font-display text-xl font-bold text-navy">{value}</div>
              <div className="text-[11px] text-charcoal/60">{label}</div>
            </div>
          ))}
        </div>

        <div className="mb-2 mt-5 text-sm font-semibold text-navy">{a.agingTitle}</div>
        <ul className="space-y-2.5">
          {Object.keys(a.aging).map((k) => (
            <li key={k} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-charcoal/70">{a.aging[k]}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-offwhite">
                <div className="h-full rounded-full bg-sky" style={{ width: `${(F.aging[k] / agingMax) * 100}%` }} />
              </div>
              <span className="w-8 shrink-0 text-end font-semibold text-navy">{F.aging[k]}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
