// app/lib/auditing.js
//
// منطق داشبورد زيارات التدقيق (Operational Audit) الصافي: ثوابت، تحقق من المدخلات،
// وحسابات الداشبورد والتحليلات. من غير داتابيز ولا HTTP.
//
// ✅ نسبة الالتزام = مطابق ÷ (مطابق + غير مطابق) — "لا ينطبق" مش بيتحسب.
// ✅ الإحصائيات بتحسب زيارات التدقيق "المكتملة" بس.
// 📅 التواريخ نص "YYYY-MM-DD" (UTC) في كل مكان.

import { parseDay, toDay, addDays, daysBetween, shiftMonth, validateBranch, validatePeriod, BRANCH_STATUSES } from "./mysteryShopping";

export { parseDay, toDay, addDays, daysBetween, shiftMonth, validateBranch, validatePeriod, BRANCH_STATUSES };

export const AREAS = ["products", "facility", "hygiene_safety", "procedures"];
export const SEVERITIES = ["critical", "major", "minor"];
export const RESULTS = ["pass", "fail", "na"];
export const VISIT_STATUSES = ["scheduled", "completed", "cancelled"];
export const FINDING_STATUSES = ["open", "in_progress", "closed"];

export const LIMITS = { branches: 200, visits: 20000, findings: 20000, itemsPerArea: 30, resultsPerVisit: 300 };
export const DEFAULT_SETTINGS = {
  orgName: "",
  targetCompliance: 90,
  compliantFrom: 90,
  partialFrom: 75,
  sla: { critical: 3, major: 7, minor: 14 },
  checklist: null, // null = القايمة الافتراضية (بتتعرّف في الواجهة حسب اللغة)
};

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : v == null ? "" : null);
const fail = (error) => ({ error });
const r1 = (n) => Math.round(n * 10) / 10;
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

// ───────────────────────── نتايج الفحص ─────────────────────────
export function countResults(results = []) {
  const c = { pass: 0, fail: 0, na: 0, critical: 0 };
  for (const r of results) {
    c[r.result] += 1;
    if (r.result === "fail" && r.severity === "critical") c.critical += 1;
  }
  return c;
}

// نسبة الالتزام (0..100) أو null لو مفيش بنود مطابق/غير مطابق.
export function scoreOf(results = []) {
  const p = results.filter((r) => r.result === "pass").length;
  const f = results.filter((r) => r.result === "fail").length;
  return p + f ? (p / (p + f)) * 100 : null;
}

export function levelOf(score, s = DEFAULT_SETTINGS) {
  if (score == null) return null;
  return score >= s.compliantFrom ? "compliant" : score >= s.partialFrom ? "partial" : "non_compliant";
}

// ───────────────────────── تحقق ─────────────────────────
export function validateVisit(body) {
  if (!isObj(body)) return fail("invalid_body");
  if (typeof body.branchId !== "string" || !body.branchId) return fail("branch_required");
  const date = parseDay(body.date);
  if (!date) return fail("date_invalid");
  const status = body.status ?? "completed";
  if (!VISIT_STATUSES.includes(status)) return fail("status_invalid");
  const auditor = text(body.auditor, 80);
  const notes = text(body.notes, 2000);
  if (auditor === null || notes === null) return fail("text_invalid");

  let results = [];
  let compliance = null;
  if (status === "completed") {
    if (!Array.isArray(body.results) || !body.results.length) return fail("results_required");
    if (body.results.length > LIMITS.resultsPerVisit) return fail("results_invalid");
    const seen = new Set();
    for (const r of body.results) {
      if (!isObj(r)) return fail("results_invalid");
      if (!AREAS.includes(r.area)) return fail("area_invalid");
      if (!RESULTS.includes(r.result)) return fail("results_invalid");
      const item = text(r.item, 160);
      if (!item) return fail("results_invalid");
      const key = `${r.area}|${item}`;
      if (seen.has(key)) return fail("results_invalid");
      seen.add(key);
      const row = { area: r.area, item, result: r.result };
      if (r.result === "fail") {
        const severity = r.severity ?? "major";
        if (!SEVERITIES.includes(severity)) return fail("severity_invalid");
        const note = text(r.note, 500);
        if (note === null) return fail("text_invalid");
        row.severity = severity;
        row.note = note;
      }
      results.push(row);
    }
    if (!results.some((r) => r.result !== "na")) return fail("results_required");
    compliance = r1(scoreOf(results));
  }
  return { value: { branchId: body.branchId, date, auditor, status, results, compliance, notes } };
}

export function validateFinding(body, { locked = false } = {}) {
  if (!isObj(body)) return fail("invalid_body");
  const value = {};
  const note = text(body.note, 1000);
  const resolution = text(body.resolution, 1000);
  const assignee = text(body.assignee, 80);
  if (note === null || resolution === null || assignee === null) return fail("text_invalid");
  Object.assign(value, { note, resolution, assignee });

  const status = body.status ?? "open";
  if (!FINDING_STATUSES.includes(status)) return fail("status_invalid");
  value.status = status;

  value.dueDate = null;
  if (body.dueDate) {
    value.dueDate = parseDay(body.dueDate);
    if (!value.dueDate) return fail("date_invalid");
  }
  // لو الملاحظة جاية من زيارة تدقيق: العنوان والمجال والخطورة بيتعدّلوا من الزيارة نفسها.
  if (!locked) {
    const title = text(body.title, 160);
    if (!title) return fail("title_required");
    if (!AREAS.includes(body.area)) return fail("area_invalid");
    const severity = body.severity ?? "major";
    if (!SEVERITIES.includes(severity)) return fail("severity_invalid");
    value.title = title;
    value.area = body.area;
    value.severity = severity;
    value.branchId = typeof body.branchId === "string" && body.branchId ? body.branchId : null;
  }
  return { value };
}

function cleanChecklist(raw) {
  if (raw == null) return { value: null };
  if (!isObj(raw)) return fail("checklist_invalid");
  const out = {};
  let any = false;
  for (const area of AREAS) {
    const list = raw[area];
    if (list == null) {
      out[area] = [];
      continue;
    }
    if (!Array.isArray(list)) return fail("checklist_invalid");
    const items = [...new Set(list.map((i) => (typeof i === "string" ? i.trim().slice(0, 160) : "")).filter(Boolean))];
    if (items.length > LIMITS.itemsPerArea) return fail("checklist_too_long");
    out[area] = items;
    if (items.length) any = true;
  }
  return { value: any ? out : null };
}

export function validateSettings(body) {
  if (!isObj(body)) return fail("invalid_body");
  const orgName = text(body.orgName, 80);
  if (orgName === null) return fail("text_invalid");
  const pct = (v) => Number.isInteger(v) && v >= 0 && v <= 100;
  const { targetCompliance, compliantFrom, partialFrom } = body;
  if (![targetCompliance, compliantFrom, partialFrom].every(pct)) return fail("score_invalid");
  if (partialFrom >= compliantFrom) return fail("thresholds_invalid");
  const sla = {};
  for (const s of SEVERITIES) {
    const n = body.sla?.[s];
    if (!Number.isInteger(n) || n < 1 || n > 365) return fail("sla_invalid");
    sla[s] = n;
  }
  const checklist = cleanChecklist(body.checklist);
  if (checklist.error) return checklist;
  return { value: { orgName, targetCompliance, compliantFrom, partialFrom, sla, checklist: checklist.value } };
}

// ───────────────────────── حسابات ─────────────────────────
const isScored = (v) => v.status === "completed" && scoreOf(v.results) != null;
const within = (list, from, to) => list.filter((v) => v.date >= from && v.date <= to);
const pooled = (list) => scoreOf(list.flatMap((v) => v.results));
const rnd = (n) => (n == null ? null : Math.round(n));
const pctChange = (cur, prev) => (prev ? r1(((cur - prev) / prev) * 100) : null);
const monthsEnding = (to, n = 6) => Array.from({ length: n }, (_, i) => shiftMonth(to.slice(0, 7), i - (n - 1)));
const isOpen = (f) => f.status !== "closed";

function groupBy(list, keyFn) {
  const m = new Map();
  for (const x of list) {
    const k = keyFn(x);
    const arr = m.get(k) || [];
    arr.push(x);
    m.set(k, arr);
  }
  return m;
}

function areaScores(list) {
  const out = {};
  for (const a of AREAS) {
    const rows = list.flatMap((v) => v.results.filter((r) => r.area === a));
    out[a] = rnd(scoreOf(rows));
  }
  return out;
}

export function computeDashboard({ visits, findings, branches, from, to, settings = DEFAULT_SETTINGS, today }) {
  const scored = visits.filter(isScored);
  const len = daysBetween(from, to) + 1;
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(len - 1));
  const cur = within(scored, from, to);
  const prev = within(scored, prevFrom, prevTo);
  const nameOf = new Map(branches.map((b) => [String(b._id), b.name]));

  const score = rnd(pooled(cur));
  const prevScore = rnd(pooled(prev));
  const curBranches = new Set(cur.map((v) => v.branchId));
  const prevBranches = new Set(prev.map((v) => v.branchId));

  const branchRows = [...groupBy(cur, (v) => v.branchId).entries()]
    .map(([id, rows]) => ({ id, name: nameOf.get(id) || "—", visits: rows.length, score: rnd(pooled(rows)) }))
    .sort((a, b) => b.score - a.score || b.visits - a.visits);

  const areas = AREAS.map((key) => {
    const rows = cur.flatMap((v) => v.results.filter((r) => r.area === key));
    return { key, value: rnd(scoreOf(rows)), fails: rows.filter((r) => r.result === "fail").length };
  });

  // الاتجاه: آخر ٦ شهور بتنتهي بشهر "to" (مستقل عن الفترة المختارة).
  const months = monthsEnding(to);
  const trend = {
    months,
    compliance: months.map((k) => rnd(pooled(scored.filter((v) => v.date.slice(0, 7) === k)))),
    audits: months.map((k) => scored.filter((v) => v.date.slice(0, 7) === k).length),
    opened: months.map((k) => findings.filter((f) => f.openedAt.slice(0, 7) === k).length),
    closed: months.map((k) => findings.filter((f) => f.closedAt && f.closedAt.slice(0, 7) === k).length),
  };

  const open = findings.filter(isOpen);
  const openAtStart = findings.filter((f) => f.openedAt < from && (!f.closedAt || f.closedAt >= from)).length;
  const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, open.filter((f) => f.severity === s).length]));

  const scheduled = visits.filter((v) => v.status === "scheduled");
  const horizon = addDays(today, 7);
  const upcoming = scheduled
    .filter((v) => v.date <= horizon)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)
    .map((v) => ({ id: v.id, date: v.date, branch: nameOf.get(v.branchId) || "—", overdue: v.date < today }));

  const recent = [...cur]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
    .map((v) => ({
      id: v.id,
      date: v.date,
      branch: nameOf.get(v.branchId) || "—",
      auditor: v.auditor,
      score: rnd(scoreOf(v.results)),
      fails: v.counts.fail,
      critical: v.counts.critical,
    }));

  return {
    period: { from, to, prevFrom, prevTo },
    hasData: cur.length > 0,
    everHadData: scored.length > 0,
    kpis: {
      audits: { value: cur.length, delta: pctChange(cur.length, prev.length) },
      compliance: { value: score, delta: score != null && prevScore != null ? score - prevScore : null },
      branches: { value: curBranches.size, delta: prev.length ? curBranches.size - prevBranches.size : null },
      openFindings: { value: open.length, delta: open.length - openAtStart, critical: bySeverity.critical },
    },
    overall: { score, delta: score != null && prevScore != null ? score - prevScore : null, level: levelOf(score, settings) },
    trend,
    branches: branchRows,
    areas,
    findings: { open: open.length, bySeverity },
    statusCounts: {
      completed: cur.length,
      scheduled: within(visits, from, to).filter((v) => v.status === "scheduled").length,
      cancelled: within(visits, from, to).filter((v) => v.status === "cancelled").length,
    },
    alerts: {
      overdueVisits: scheduled.filter((v) => v.date < today).length,
      overdueFindings: open.filter((f) => f.dueDate && f.dueDate < today).length,
      criticalOpen: bySeverity.critical,
      belowThreshold: branchRows.filter((b) => b.score < settings.partialFrom).map((b) => ({ name: b.name, score: b.score })),
      items: upcoming,
    },
    recent,
  };
}

export function computeAnalytics({ visits, findings, branches, from, to, settings = DEFAULT_SETTINGS, today }) {
  const scored = visits.filter(isScored);
  const list = within(scored, from, to);
  const nameOf = new Map(branches.map((b) => [String(b._id), b.name]));
  const failsOf = (rows) => rows.reduce((n, v) => n + v.counts.fail, 0);

  const matrix = [...groupBy(list, (v) => v.branchId).entries()]
    .map(([id, rows]) => ({ id, name: nameOf.get(id) || "—", audits: rows.length, scores: areaScores(rows), score: rnd(pooled(rows)), fails: failsOf(rows) }))
    .sort((a, b) => b.score - a.score);

  const totals = { audits: list.length, scores: areaScores(list), score: rnd(pooled(list)), fails: failsOf(list) };

  const levels = ["compliant", "partial", "non_compliant"].map((key) => ({
    key,
    count: list.filter((v) => levelOf(scoreOf(v.results), settings) === key).length,
  }));

  const auditors = [...groupBy(list, (v) => v.auditor || "").entries()]
    .map(([name, rows]) => ({ name, audits: rows.length, avg: rnd(avg(rows.map((v) => scoreOf(v.results)))) }))
    .sort((a, b) => b.audits - a.audits);

  const failMap = new Map();
  for (const v of list) {
    for (const r of v.results) {
      if (r.result !== "fail") continue;
      const k = `${r.area}|${r.item}`;
      const e = failMap.get(k) || { item: r.item, area: r.area, count: 0, branches: new Set() };
      e.count += 1;
      e.branches.add(v.branchId);
      failMap.set(k, e);
    }
  }
  const topFailures = [...failMap.values()]
    .map((e) => ({ item: e.item, area: e.area, count: e.count, branches: e.branches.size }))
    .sort((a, b) => b.count - a.count || b.branches - a.branches)
    .slice(0, 10);

  const months = monthsEnding(to);
  const areaTrend = { months, series: Object.fromEntries(AREAS.map((a) => [a, months.map((k) => areaScores(scored.filter((v) => v.date.slice(0, 7) === k))[a])])) };

  // إدارة الملاحظات
  const openedIn = findings.filter((f) => f.openedAt >= from && f.openedAt <= to);
  const closedIn = findings.filter((f) => f.closedAt && f.closedAt >= from && f.closedAt <= to);
  const withDue = closedIn.filter((f) => f.dueDate);
  const age = (f) => daysBetween(f.openedAt, today);
  const open = findings.filter(isOpen);
  const findingsStats = {
    openedInPeriod: openedIn.length,
    closedInPeriod: closedIn.length,
    avgCloseDays: closedIn.length ? r1(avg(closedIn.map((f) => Math.max(0, daysBetween(f.openedAt, f.closedAt))))) : null,
    slaRate: withDue.length ? Math.round((withDue.filter((f) => f.closedAt <= f.dueDate).length / withDue.length) * 100) : null,
    aging: {
      d0_7: open.filter((f) => age(f) <= 7).length,
      d8_14: open.filter((f) => age(f) > 7 && age(f) <= 14).length,
      d15_30: open.filter((f) => age(f) > 14 && age(f) <= 30).length,
      d31_plus: open.filter((f) => age(f) > 30).length,
    },
  };

  // أبرز النقاط
  const len = daysBetween(from, to) + 1;
  const prevTo = addDays(from, -1);
  const prevList = within(scored, addDays(prevTo, -(len - 1)), prevTo);
  const prevByBranch = new Map([...groupBy(prevList, (v) => v.branchId).entries()].map(([id, rows]) => [id, pooled(rows)]));
  let improved = null;
  for (const b of matrix) {
    const before = prevByBranch.get(b.id);
    if (before == null) continue;
    const delta = r1(b.score - before);
    if (delta > 0 && (!improved || delta > improved.delta)) improved = { name: b.name, delta };
  }
  const areaRank = AREAS.filter((a) => totals.scores[a] != null).map((key) => ({ key, value: totals.scores[key] })).sort((a, b) => b.value - a.value);
  const highlights = {
    best: matrix[0] ? { name: matrix[0].name, score: matrix[0].score } : null,
    lowest: matrix.length > 1 ? { name: matrix[matrix.length - 1].name, score: matrix[matrix.length - 1].score } : null,
    strongestArea: areaRank[0] || null,
    weakestArea: areaRank.length > 1 ? areaRank[areaRank.length - 1] : null,
    improved,
    topFailure: topFailures[0] ? { item: topFailures[0].item, count: topFailures[0].count } : null,
  };

  return { period: { from, to }, total: list.length, matrix, totals, levels, auditors, topFailures, areaTrend, findings: findingsStats, highlights };
}
