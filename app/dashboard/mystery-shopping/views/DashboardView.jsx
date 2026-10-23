"use client";

// الداشبورد الرئيسية: كل الأرقام جاية من /api/mystery/dashboard (محسوبة من الزيارات الفعلية).

import { ShoppingBag, Star, Building2, TrendingUp, ClipboardList, MapPin, CalendarClock, ListChecks } from "lucide-react";
import { useApi, useMs, errMsg, localDay, formatDay, monthLabel, levelStyle } from "../client";
import { Card, Loading, ErrorBox, Empty, Btn, Chip, Delta } from "../components/ui";
import { Gauge, TrendChart, BranchBars, RadarChart } from "../components/Charts";

const KPI_STYLE = {
  visits: { Icon: ShoppingBag, bg: "bg-sky/15", fg: "text-sky" },
  rating: { Icon: Star, bg: "bg-gold/20", fg: "text-gold" },
  branches: { Icon: Building2, bg: "bg-blue-100", fg: "text-blue-600" },
  improvement: { Icon: TrendingUp, bg: "bg-amber-100", fg: "text-amber-600" },
};

export default function DashboardView() {
  const { t, language, rtl, range, go } = useMs();
  const { data: D, error, loading, reload } = useApi("dashboard", { from: range.from, to: range.to, today: localDay() });

  if (!D) {
    return error ? <ErrorBox message={errMsg(t, error)} onRetry={reload} retryLabel={t.c.retry} /> : <Loading text={t.c.loading} />;
  }

  // لسه مفيش ولا زيارة مكتملة خالص → خطوات البداية.
  if (!D.everHadData) {
    return (
      <Empty icon={ClipboardList} title={t.emptyTitle} text={t.emptyText}>
        <div className="w-full max-w-sm space-y-2 text-start text-sm text-charcoal/80">
          <div className="flex items-center gap-3 rounded-xl bg-offwhite px-4 py-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky text-xs font-bold text-white">1</span>
            {t.step1}
            <span className="ms-auto text-xs text-charcoal/50">{D.branchCount}</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-offwhite px-4 py-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky text-xs font-bold text-white">2</span>
            {t.step2}
          </div>
        </div>
        <div className="mt-2 flex w-full flex-wrap justify-center gap-2">
          <Btn onClick={() => go("branches")}>
            <MapPin size={16} />
            {t.goBranches}
          </Btn>
          <Btn variant="secondary" onClick={() => go("visits")} disabled={D.branchCount === 0}>
            <ClipboardList size={16} />
            {t.goVisits}
          </Btn>
        </div>
      </Empty>
    );
  }

  const months = D.trend.months.map((m) => monthLabel(m, language));
  const level = D.overall.level;
  const lvlColor = level ? levelStyle[level].color : "#C9A227";
  const branchItems = D.branches.slice(0, 8).map((b, i) => ({ label: b.name, score: b.score, highlight: i === 0 && D.branches.length > 1 }));
  const criteriaItems = D.criteria.map((c) => ({ label: t.criteria[c.key], value: c.value }));
  const compared = t.vsPrev;
  const target = D.settings.targetScore;
  const score = D.overall.score;
  const al = D.alerts;
  const hasAlerts = al.overdueVisits > 0 || al.overdueActions > 0 || D.openActions > 0 || al.items.length > 0;

  const kpis = [
    { key: "visits", value: D.kpis.visits.value, delta: D.kpis.visits.delta, unit: "%" },
    { key: "rating", value: D.kpis.rating.value ?? "—", suffix: D.kpis.rating.value != null ? "/5" : "", delta: D.kpis.rating.delta, unit: "" },
    { key: "branches", value: D.kpis.branches.value, delta: D.kpis.branches.delta, unit: "" },
    { key: "improvement", value: D.kpis.improvement.value ?? "—", suffix: D.kpis.improvement.value != null ? "%" : "", delta: D.kpis.improvement.delta, unit: "%" },
  ];

  return (
    <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {!D.hasData && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t.noVisitsInPeriod}</div>
      )}

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const { Icon, bg, fg } = KPI_STYLE[k.key];
          return (
            <div key={k.key} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${bg} ${fg}`}>
                <Icon size={24} />
              </span>
              <div className="min-w-0">
                <div className="text-sm text-charcoal/70">{t.kpi[k.key]}</div>
                <div className="font-display text-3xl font-bold text-navy">
                  {k.value}
                  {k.suffix && <span className="text-lg font-semibold text-charcoal/60">{k.suffix}</span>}
                </div>
                <Delta delta={k.delta} unit={k.unit} compared={compared} noChange={t.noChange} />
              </div>
            </div>
          );
        })}
      </section>

      {/* Row 2 */}
      <section className="mt-5 grid gap-5 lg:grid-cols-12">
        <Card title={t.overallTitle} className="lg:col-span-3">
          <Gauge value={score} label={level ? t.levels[level] : ""} color={lvlColor} />
          <div className="mt-1 text-center">
            <Delta delta={D.overall.delta} unit="%" compared={compared} noChange={t.noChange} center />
          </div>
        </Card>

        <Card title={t.trendTitle} className="lg:col-span-5">
          <TrendChart
            months={months}
            quality={D.trend.quality}
            rating={D.trend.rating}
            qualityLabel={t.qualityScore}
            ratingLabel={t.avgRating}
            rtl={rtl}
          />
        </Card>

        <Card title={t.branchTitle} className="lg:col-span-4">
          {branchItems.length ? (
            <>
              <BranchBars items={branchItems} rtl={rtl} />
              {D.branches.length > 8 && <p className="mt-1 text-center text-xs text-charcoal/50">{t.moreBranches(D.branches.length - 8)}</p>}
            </>
          ) : (
            <p className="py-10 text-center text-sm text-charcoal/50">{t.noVisitsInPeriod}</p>
          )}
        </Card>
      </section>

      {/* Row 3 */}
      <section className="mt-5 grid gap-5 lg:grid-cols-12">
        <Card title={t.criteriaTitle} className="lg:col-span-5">
          {D.hasData ? <RadarChart items={criteriaItems} /> : <p className="py-10 text-center text-sm text-charcoal/50">{t.noVisitsInPeriod}</p>}
        </Card>

        <div className="space-y-5 lg:col-span-7">
          {score != null && (
            <Card title={t.targetTitle}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-charcoal/80">{score >= target ? t.targetReached(score, target) : t.targetGap(score, target)}</span>
                {level && <Chip tone={level === "excellent" ? "gold" : level === "good" ? "sky" : "red"}>{t.levels[level]}</Chip>}
              </div>
              <div className="relative mt-3 h-2.5 rounded-full bg-offwhite">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, background: lvlColor }} />
                <span className="absolute -top-1 w-0.5 bg-navy" style={{ insetInlineStart: `${target}%`, height: 18 }} title={`${target}%`} />
              </div>
            </Card>
          )}

          <Card title={t.alertsTitle}>
            {hasAlerts ? (
              <div className="space-y-3 text-sm">
                {(al.overdueVisits > 0 || al.overdueActions > 0 || D.openActions > 0) && (
                  <ul className="space-y-2">
                    {al.overdueVisits > 0 && (
                      <li>
                        <button type="button" onClick={() => go("visits")} className="flex w-full items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-start text-red-700 hover:bg-red-100">
                          <CalendarClock size={16} />
                          {t.overdueVisits(al.overdueVisits)}
                        </button>
                      </li>
                    )}
                    {al.overdueActions > 0 && (
                      <li>
                        <button type="button" onClick={() => go("actions")} className="flex w-full items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-start text-red-700 hover:bg-red-100">
                          <ListChecks size={16} />
                          {t.overdueActions(al.overdueActions)}
                        </button>
                      </li>
                    )}
                    {D.openActions > 0 && (
                      <li>
                        <button type="button" onClick={() => go("actions")} className="flex w-full items-center gap-2 rounded-lg bg-offwhite px-3 py-2 text-start text-charcoal/80 hover:bg-sky/10">
                          <ListChecks size={16} />
                          {t.openActions(D.openActions)}
                        </button>
                      </li>
                    )}
                  </ul>
                )}
                <div>
                  <div className="mb-1.5 text-xs font-semibold text-charcoal/60">{t.upcomingVisits}</div>
                  {al.items.length ? (
                    <ul className="divide-y divide-charcoal/10">
                      {al.items.map((v) => (
                        <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                          <span className="font-medium text-navy">{v.branch}</span>
                          <span className="flex items-center gap-2 text-charcoal/70">
                            {formatDay(v.date, language)}
                            {v.overdue && <Chip tone="red">{t.overdueTag}</Chip>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-charcoal/50">{t.nothingScheduled}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-charcoal/50">{t.nothingScheduled}</p>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
