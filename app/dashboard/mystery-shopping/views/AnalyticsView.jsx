"use client";

// تحليلات أعمق: مصفوفة فرع × معيار، توزيع التقييمات، أداء المقيّمين.

import { useApi, useMs, errMsg } from "../client";
import { Card, Loading, ErrorBox, Empty } from "../components/ui";
import { TrendingUp } from "lucide-react";

const CRITERIA = ["service", "cleanliness", "speed", "staff"];

// لون الخلية: أحمر (١) → أخضر (٥).
const heat = (v) => (Number.isFinite(v) ? { background: `hsl(${((v - 1) / 4) * 120}, 60%, 90%)` } : undefined);

export default function AnalyticsView() {
  const { t, range } = useMs();
  const { data: A, error, loading, reload } = useApi("analytics", { from: range.from, to: range.to });

  if (!A) return error ? <ErrorBox message={errMsg(t, error)} onRetry={reload} retryLabel={t.c.retry} /> : <Loading text={t.c.loading} />;
  if (A.total === 0) return <Empty icon={TrendingUp} text={t.analytics.none} />;

  const maxCount = Math.max(1, ...A.distribution.map((d) => d.count));
  const th = "px-3 py-3 text-start font-semibold";

  return (
    <div className={`space-y-5 ${loading ? "opacity-60" : ""}`}>
      <Card title={t.analytics.matrixTitle}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs text-charcoal/60">
                <th className={th}>{t.analytics.branch}</th>
                <th className={th}>{t.analytics.visits}</th>
                {CRITERIA.map((c) => (
                  <th key={c} className={th}>
                    {t.criteria[c]}
                  </th>
                ))}
                <th className={th}>{t.analytics.overall}</th>
              </tr>
            </thead>
            <tbody>
              {A.matrix.map((r) => (
                <tr key={r.id} className="border-b border-charcoal/5">
                  <td className="px-3 py-2.5 font-semibold text-navy">{r.name}</td>
                  <td className="px-3 py-2.5 text-charcoal/70">{r.visits}</td>
                  {CRITERIA.map((c) => (
                    <td key={c} className="px-3 py-2.5">
                      <span className="inline-block min-w-[2.5rem] rounded-md px-2 py-1 text-center font-semibold text-navy" style={heat(r.scores[c])}>
                        {r.scores[c] ?? "—"}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-2.5 font-bold text-navy">{r.score}%</td>
                </tr>
              ))}
              <tr className="bg-offwhite">
                <td className="px-3 py-2.5 font-bold text-navy">{t.analytics.totals}</td>
                <td className="px-3 py-2.5 text-charcoal/70">{A.totals.visits}</td>
                {CRITERIA.map((c) => (
                  <td key={c} className="px-3 py-2.5 font-semibold text-navy">
                    {A.totals.scores[c] ?? "—"}
                  </td>
                ))}
                <td className="px-3 py-2.5 font-bold text-navy">{A.totals.score}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={t.analytics.distributionTitle}>
          <ul className="space-y-2.5">
            {[...A.distribution].reverse().map((d) => (
              <li key={d.rating} className="flex items-center gap-3 text-sm">
                <span className="w-8 shrink-0 text-charcoal/70">{t.analytics.stars(d.rating)}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-offwhite">
                  <div className="h-full rounded-full bg-sky" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                </div>
                <span className="w-8 shrink-0 text-end font-semibold text-navy">{d.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={t.analytics.evaluatorsTitle}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 text-xs text-charcoal/60">
                  <th className={th}>{t.analytics.evaluator}</th>
                  <th className={th}>{t.analytics.visits}</th>
                  <th className={th}>{t.analytics.avg}</th>
                </tr>
              </thead>
              <tbody>
                {A.evaluators.map((e, i) => (
                  <tr key={`${e.name}${i}`} className="border-b border-charcoal/5 last:border-0">
                    <td className="px-3 py-2.5 font-semibold text-navy">{e.name || t.analytics.unnamed}</td>
                    <td className="px-3 py-2.5 text-charcoal/70">{e.visits}</td>
                    <td className="px-3 py-2.5 text-charcoal/80">
                      {e.rating}/5 · {e.score}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
