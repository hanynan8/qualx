"use client";

// الداشبورد الرئيسية: كل الأرقام جاية من /api/audit/dashboard (محسوبة من الزيارات والملاحظات الفعلية).

import { ClipboardCheck, ShieldCheck, Building2, ShieldAlert, ClipboardList, MapPin, CalendarClock, AlertTriangle, TrendingDown } from "lucide-react";
import { useApi, useAu, errMsg, localDay, formatDay, monthLabel, levelStyle, severityStyle, SEVERITIES } from "../client";
import { Card, Loading, ErrorBox, Empty, Btn, Chip, Delta } from "../../_shared/ui";
import { Gauge, BranchBars } from "../../_shared/Charts";
import { ComplianceTrend, FindingsFlow, AreaBars, SegmentBar } from "../components/AuditCharts";

const KPI_STYLE = {
  audits: { Icon: ClipboardCheck, bg: "bg-sky/15", fg: "text-sky" },
  compliance: { Icon: ShieldCheck, bg: "bg-emerald-100", fg: "text-emerald-600" },
  branches: { Icon: Building2, bg: "bg-blue-100", fg: "text-blue-600" },
  openFindings: { Icon: ShieldAlert, bg: "bg-red-100", fg: "text-red-500" },
};

export default function DashboardView() {
  const { t, language, rtl, range, go } = useAu();
  const { data: D, error, loading, reload } = useApi("dashboard", { from: range.from, to: range.to, today: localDay() });

  if (!D) {
    return error ? <ErrorBox message={errMsg(t, error)} onRetry={reload} retryLabel={t.c.retry} /> : <Loading text={t.c.loading} />;
  }

  // لسه مفيش ولا زيارة تدقيق مكتملة خالص → خطوات البداية.
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

  const settings = D.settings;
  const months = D.trend.months.map((m) => monthLabel(m, language));
  const level = D.overall.level;
  const lvlColor = level ? levelStyle[level].color : "#C9A227";
  const score = D.overall.score;
  const target = settings.targetCompliance;
  const branchItems = D.branches.slice(0, 8).map((b, i) => ({ label: b.name, score: b.score, highlight: i === 0 && D.branches.length > 1 }));
  const colorOf = (v) => (v >= settings.compliantFrom ? levelStyle.compliant.color : v >= settings.partialFrom ? levelStyle.partial.color : levelStyle.non_compliant.color);
  const areaItems = D.areas.map((a) => ({ key: a.key, label: t.areas[a.key], value: a.value, sub: a.value != null ? t.fails(a.fails) : "" }));
  const F = D.findings;
  const al = D.alerts;
  const hasAlerts = al.overdueVisits > 0 || al.overdueFindings > 0 || al.criticalOpen > 0 || al.belowThreshold.length > 0;

  const kpis = [
    { key: "audits", value: D.kpis.audits.value, delta: D.kpis.audits.delta, unit: "%", compared: t.vsPrev },
    { key: "compliance", value: D.kpis.compliance.value ?? "—", suffix: D.kpis.compliance.value != null ? "%" : "", delta: D.kpis.compliance.delta, unit: "%", compared: t.vsPrev },
    { key: "branches", value: D.kpis.branches.value, delta: D.kpis.branches.delta, unit: "", compared: t.vsPrev },
    { key: "openFindings", value: D.kpis.openFindings.value, delta: D.kpis.openFindings.delta, unit: "", compared: t.vsStart, invert: true, extra: D.kpis.openFindings.critical > 0 ? t.criticalOpen(D.kpis.openFindings.critical) : null },
  ];

  return (
    <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {!D.hasData && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t.noVisitsInPeriod}</div>}

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
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-navy">
                    {k.value}
                    {k.suffix && <span className="text-lg font-semibold text-charcoal/60">{k.suffix}</span>}
                  </span>
                  {k.extra && <Chip tone="red">{k.extra}</Chip>}
                </div>
                <Delta delta={k.delta} unit={k.unit} compared={k.compared} noChange={t.noChange} invert={k.invert} />
              </div>
            </div>
          );
        })}
      </section>

      {/* Row 2: gauge + trend + branches */}
      <section className="mt-5 grid gap-5 lg:grid-cols-12">
        <Card title={t.overallTitle} className="lg:col-span-3">
          <Gauge value={score} label={level ? t.levels[level] : ""} color={lvlColor} stars={false} />
          <div className="mt-1 text-center">
            <Delta delta={D.overall.delta} unit="%" compared={t.vsPrev} noChange={t.noChange} center />
          </div>
        </Card>

        <Card title={t.trendTitle} className="lg:col-span-5">
          <ComplianceTrend months={months} values={D.trend.compliance} target={target} label={t.complianceLabel} targetLabel={t.targetLabel} rtl={rtl} />
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

      {/* Row 3: areas + findings by severity + flow */}
      <section className="mt-5 grid gap-5 lg:grid-cols-12">
        <Card title={t.areasTitle} className="lg:col-span-4">
          {D.hasData ? <AreaBars items={areaItems} colorOf={colorOf} /> : <p className="py-10 text-center text-sm text-charcoal/50">{t.noVisitsInPeriod}</p>}
        </Card>

        <Card
          title={t.severityTitle}
          className="lg:col-span-3"
          right={
            F.open > 0 ? (
              <button type="button" onClick={() => go("findings")} className="text-xs font-semibold text-sky hover:underline">
                {t.c.view}
              </button>
            ) : null
          }
        >
          {F.open > 0 ? (
            <SegmentBar segments={SEVERITIES.map((s) => ({ key: s, label: t.severities[s], value: F.bySeverity[s], color: severityStyle[s].color }))} />
          ) : (
            <p className="py-10 text-center text-sm text-emerald-700">{t.noOpenFindings}</p>
          )}
        </Card>

        <Card title={t.flowTitle} className="lg:col-span-5">
          <FindingsFlow months={months} opened={D.trend.opened} closed={D.trend.closed} openedLabel={t.openedLabel} closedLabel={t.closedLabel} rtl={rtl} />
        </Card>
      </section>

      {/* Row 4: target + alerts + recent */}
      <section className="mt-5 grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-6">
          {score != null && (
            <Card title={t.targetTitle}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-charcoal/80">{score >= target ? t.targetReached(score, target) : t.targetGap(score, target)}</span>
                {level && <Chip tone={levelStyle[level].tone}>{t.levels[level]}</Chip>}
              </div>
              <div className="relative mt-3 h-2.5 rounded-full bg-offwhite">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, background: lvlColor }} />
                <span className="absolute -top-1 w-0.5 bg-navy" style={{ insetInlineStart: `${target}%`, height: 18 }} title={`${target}%`} />
              </div>
            </Card>
          )}

          <Card title={t.alertsTitle}>
            <div className="space-y-3 text-sm">
              {hasAlerts && (
                <ul className="space-y-2">
                  {al.criticalOpen > 0 && (
                    <li>
                      <button type="button" onClick={() => go("findings")} className="flex w-full items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-start text-red-700 hover:bg-red-100">
                        <AlertTriangle size={16} />
                        {t.criticalAlert(al.criticalOpen)}
                      </button>
                    </li>
                  )}
                  {al.overdueFindings > 0 && (
                    <li>
                      <button type="button" onClick={() => go("findings")} className="flex w-full items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-start text-red-700 hover:bg-red-100">
                        <ShieldAlert size={16} />
                        {t.overdueFindings(al.overdueFindings)}
                      </button>
                    </li>
                  )}
                  {al.overdueVisits > 0 && (
                    <li>
                      <button type="button" onClick={() => go("visits")} className="flex w-full items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-start text-amber-800 hover:bg-amber-100">
                        <CalendarClock size={16} />
                        {t.overdueVisits(al.overdueVisits)}
                      </button>
                    </li>
                  )}
                  {al.belowThreshold.length > 0 && (
                    <li>
                      <button type="button" onClick={() => go("analytics")} className="flex w-full items-center gap-2 rounded-lg bg-offwhite px-3 py-2 text-start text-charcoal/80 hover:bg-sky/10">
                        <TrendingDown size={16} />
                        {t.belowThreshold(al.belowThreshold.map((b) => `${b.name} (${b.score}%)`).join("، "))}
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
          </Card>
        </div>

        <Card
          title={t.recentTitle}
          className="lg:col-span-6"
          right={
            <button type="button" onClick={() => go("visits")} className="text-xs font-semibold text-sky hover:underline">
              {t.c.view}
            </button>
          }
        >
          {D.recent.length ? (
            <ul className="divide-y divide-charcoal/10">
              {D.recent.map((v) => {
                const lv = v.score >= settings.compliantFrom ? "compliant" : v.score >= settings.partialFrom ? "partial" : "non_compliant";
                return (
                  <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-navy">{v.branch}</div>
                      <div className="text-xs text-charcoal/55">
                        {formatDay(v.date, language)}
                        {v.auditor ? ` · ${v.auditor}` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {v.critical > 0 ? <Chip tone="red">{t.criticalOpen(v.critical)}</Chip> : v.fails === 0 ? <Chip tone="green">{t.noFails}</Chip> : <span className="text-xs text-charcoal/60">{t.fails(v.fails)}</span>}
                      <Chip tone={levelStyle[lv].tone}>{v.score}%</Chip>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-charcoal/50">{t.noVisitsInPeriod}</p>
          )}
        </Card>
      </section>
    </div>
  );
}
