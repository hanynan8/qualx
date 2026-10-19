// app/lib/mysteryShopping.js
//
// منطق الميستري شوبنج الصافي (من غير داتابيز ولا HTTP): الثوابت، التحقق من
// المدخلات، وحسابات الداشبورد والتحليلات. كل الدوال هنا pure عشان تتختبر بسهولة.
//
// 📅 التواريخ بتتعامل كنص "YYYY-MM-DD" (UTC) في كل مكان، وبتتخزن Date في الداتابيز.
// ⭐ تقييم الزيارة = متوسط المعايير (من 5). درجة الجودة % = التقييم ÷ 5 × 100.
// ✅ الإحصائيات بتحسب الزيارات "المكتملة" بس (المجدولة والملغية مش داخلة في الأرقام).

export const CRITERIA = ["service", "cleanliness", "speed", "staff"];
export const VISIT_STATUSES = ["scheduled", "completed", "cancelled"];
export const ACTION_STATUSES = ["open", "in_progress", "done"];
export const ACTION_PRIORITIES = ["low", "medium", "high"];
export const BRANCH_STATUSES = ["active", "inactive"];

export const LIMITS = { branches: 200, visits: 20000, actions: 2000 };
export const DEFAULT_SETTINGS = { orgName: "", targetScore: 90, excellentFrom: 90, goodFrom: 75 };

const MAX_PERIOD_DAYS = 1830; // ~5 سنين
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// ───────────────────────── تواريخ ─────────────────────────
export function parseDay(s) {
  if (typeof s !== "string" || !DAY_RE.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return null;
  return d;
}

export function toDay(v) {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function addDays(day, n) {
  const d = parseDay(day) || new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return toDay(d);
}

export function daysBetween(a, b) {
  return Math.round((parseDay(b) - parseDay(a)) / 86400000);
}

// "2024-05" ± n شهور → "2024-03"
export function shiftMonth(key, n) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

// ───────────────────────── تحقق ─────────────────────────
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : v == null ? "" : null);
const fail = (error) => ({ error });

export function validateBranch(body) {
  if (!isObj(body)) return fail("invalid_body");
  const name = text(body.name, 80);
  const city = text(body.city, 80);
  if (!name) return fail("name_required");
  if (city === null) return fail("city_invalid");
  const status = body.status ?? "active";
  if (!BRANCH_STATUSES.includes(status)) return fail("status_invalid");
  return { value: { name, city, status } };
}

export function visitRating(scores) {
  if (!scores) return null;
  const vals = CRITERIA.map((c) => scores[c]);
  if (vals.some((n) => !Number.isFinite(n))) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function validateVisit(body) {
  if (!isObj(body)) return fail("invalid_body");
  if (typeof body.branchId !== "string" || !body.branchId) return fail("branch_required");
  const date = parseDay(body.date);
  if (!date) return fail("date_invalid");
  const status = body.status ?? "completed";
  if (!VISIT_STATUSES.includes(status)) return fail("status_invalid");
  const evaluator = text(body.evaluator, 80);
  const notes = text(body.notes, 2000);
  if (evaluator === null || notes === null) return fail("text_invalid");

  let scores = null;
  if (status === "completed") {
    if (!isObj(body.scores)) return fail("scores_required");
    scores = {};
    for (const c of CRITERIA) {
      const n = body.scores[c];
      if (!Number.isInteger(n) || n < 1 || n > 5) return fail("scores_invalid");
      scores[c] = n;
    }
  }
  return {
    value: { branchId: body.branchId, date, evaluator, status, scores, rating: visitRating(scores), notes },
  };
}

export function validateAction(body) {
  if (!isObj(body)) return fail("invalid_body");
  const title = text(body.title, 120);
  const description = text(body.description, 1000);
  if (!title) return fail("title_required");
  if (description === null) return fail("text_invalid");
  const priority = body.priority ?? "medium";
  const status = body.status ?? "open";
  if (!ACTION_PRIORITIES.includes(priority)) return fail("priority_invalid");
  if (!ACTION_STATUSES.includes(status)) return fail("status_invalid");
  let dueDate = null;
  if (body.dueDate) {
    dueDate = parseDay(body.dueDate);
    if (!dueDate) return fail("date_invalid");
  }
  const branchId = typeof body.branchId === "string" && body.branchId ? body.branchId : null;
  return { value: { title, description, priority, status, dueDate, branchId } };
}

export function validateSettings(body) {
  if (!isObj(body)) return fail("invalid_body");
  const orgName = text(body.orgName, 80);
  if (orgName === null) return fail("text_invalid");
  const pct = (v) => Number.isInteger(v) && v >= 0 && v <= 100;
  const { targetScore, excellentFrom, goodFrom } = body;
  if (![targetScore, excellentFrom, goodFrom].every(pct)) return fail("score_invalid");
  if (goodFrom >= excellentFrom) return fail("thresholds_invalid");
  return { value: { orgName, targetScore, excellentFrom, goodFrom } };
}

// from/to اختياريين: الافتراضي آخر ٣٠ يوم.
export function validatePeriod(from, to) {
  const toDayStr = to || toDay(new Date());
  const fromDayStr = from || addDays(toDayStr, -29);
  if (!parseDay(toDayStr) || !parseDay(fromDayStr)) return fail("date_invalid");
  if (fromDayStr > toDayStr) return fail("period_invalid");
  if (daysBetween(fromDayStr, toDayStr) > MAX_PERIOD_DAYS) return fail("period_too_long");
  return { value: { from: fromDayStr, to: toDayStr } };
}

// ───────────────────────── حسابات ─────────────────────────
const r1 = (n) => Math.round(n * 10) / 10;
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

// تقييم الزيارة (من 5) بالدقة الكاملة لو عندنا المعايير.
function exactRating(v) {
  if (v.scores) {
    const vals = CRITERIA.map((c) => v.scores[c]).filter(Number.isFinite);
    if (vals.length === CRITERIA.length) return avg(vals);
  }
  return Number.isFinite(v.rating) ? v.rating : null;
}

const isScored = (v) => v.status === "completed" && exactRating(v) != null;
const within = (list, from, to) => list.filter((v) => v.date >= from && v.date <= to);

export function levelOf(score, settings = DEFAULT_SETTINGS) {
  if (score == null) return null;
  if (score >= settings.excellentFrom) return "excellent";
  if (score >= settings.goodFrom) return "good";
  return "needs_work";
}

function summarize(list) {
  const ratings = list.map(exactRating);
  const byBranch = new Map();
  list.forEach((v, i) => {
    const arr = byBranch.get(v.branchId) || [];
    arr.push(ratings[i]);
    byBranch.set(v.branchId, arr);
  });
  const rating = avg(ratings);
  return {
    count: list.length,
    rating,
    quality: rating == null ? null : (rating / 5) * 100,
    byBranch,
  };
}

const pctChange = (cur, prev) => (prev ? r1(((cur - prev) / prev) * 100) : null);
const diff = (cur, prev) => (cur != null && prev != null ? r1(cur - prev) : null);

export function computeDashboard({ visits, branches, from, to, settings = DEFAULT_SETTINGS, today }) {
  const scored = visits.filter(isScored);
  const len = daysBetween(from, to) + 1;
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(len - 1));

  const cur = summarize(within(scored, from, to));
  const prev = summarize(within(scored, prevFrom, prevTo));

  // معدل التحسّن: نسبة الفروع (اللي ليها زيارات في الفترتين) اللي درجتها زادت.
  let comparable = 0;
  let improved = 0;
  for (const [id, ratings] of cur.byBranch) {
    const before = prev.byBranch.get(id);
    if (!before) continue;
    comparable += 1;
    if (avg(ratings) > avg(before)) improved += 1;
  }

  const score = cur.quality == null ? null : Math.round(cur.quality);
  const prevScore = prev.quality == null ? null : Math.round(prev.quality);

  const nameOf = new Map(branches.map((b) => [String(b._id), b.name]));
  const branchRows = [...cur.byBranch.entries()]
    .map(([id, ratings]) => ({
      id,
      name: nameOf.get(id) || "—",
      visits: ratings.length,
      rating: r1(avg(ratings)),
      score: Math.round((avg(ratings) / 5) * 100),
    }))
    .sort((a, b) => b.score - a.score || b.visits - a.visits);

  const inPeriod = within(scored, from, to);
  const criteria = CRITERIA.map((key) => {
    const vals = inPeriod.map((v) => v.scores?.[key]).filter(Number.isFinite);
    return { key, value: vals.length ? r1(avg(vals)) : null };
  });

  // الاتجاه: آخر ٦ شهور بتنتهي بشهر "to" (مستقل عن الفترة المختارة).
  const lastKey = to.slice(0, 7);
  const monthKeys = Array.from({ length: 6 }, (_, i) => shiftMonth(lastKey, i - 5));
  const trend = { months: monthKeys, quality: [], rating: [], visits: [] };
  for (const key of monthKeys) {
    const s = summarize(scored.filter((v) => v.date.slice(0, 7) === key));
    trend.quality.push(s.quality == null ? null : Math.round(s.quality));
    trend.rating.push(s.rating == null ? null : r1(s.rating));
    trend.visits.push(s.count);
  }

  const inRangeAll = within(visits, from, to);
  const horizon = addDays(today, 7);
  const scheduled = visits.filter((v) => v.status === "scheduled");

  return {
    period: { from, to, prevFrom, prevTo },
    hasData: cur.count > 0,
    everHadData: scored.length > 0,
    kpis: {
      visits: { value: cur.count, delta: pctChange(cur.count, prev.count) },
      rating: { value: cur.rating == null ? null : r1(cur.rating), delta: diff(cur.rating, prev.rating) },
      branches: { value: cur.byBranch.size, delta: prev.count ? cur.byBranch.size - prev.byBranch.size : null },
      improvement: { value: comparable ? Math.round((improved / comparable) * 100) : null, delta: null },
    },
    overall: { score, delta: score != null && prevScore != null ? score - prevScore : null, level: levelOf(score, settings) },
    trend,
    branches: branchRows,
    criteria,
    statusCounts: {
      completed: cur.count,
      scheduled: inRangeAll.filter((v) => v.status === "scheduled").length,
      cancelled: inRangeAll.filter((v) => v.status === "cancelled").length,
    },
    alerts: {
      upcoming: scheduled.filter((v) => v.date >= today && v.date <= horizon).length,
      overdueVisits: scheduled.filter((v) => v.date < today).length,
    },
  };
}

export function computeAnalytics({ visits, branches, from, to }) {
  const list = within(visits.filter(isScored), from, to);
  const nameOf = new Map(branches.map((b) => [String(b._id), b.name]));

  const critAvg = (rows) =>
    Object.fromEntries(
      CRITERIA.map((c) => {
        const vals = rows.map((v) => v.scores?.[c]).filter(Number.isFinite);
        return [c, vals.length ? r1(avg(vals)) : null];
      })
    );

  const groups = new Map();
  for (const v of list) {
    const arr = groups.get(v.branchId) || [];
    arr.push(v);
    groups.set(v.branchId, arr);
  }
  const matrix = [...groups.entries()]
    .map(([id, rows]) => ({
      id,
      name: nameOf.get(id) || "—",
      visits: rows.length,
      scores: critAvg(rows),
      score: Math.round((avg(rows.map(exactRating)) / 5) * 100),
    }))
    .sort((a, b) => b.score - a.score);

  const distribution = [1, 2, 3, 4, 5].map((rating) => ({ rating, count: 0 }));
  for (const v of list) {
    const bucket = Math.min(5, Math.max(1, Math.round(exactRating(v))));
    distribution[bucket - 1].count += 1;
  }

  const byEvaluator = new Map();
  for (const v of list) {
    const key = v.evaluator || "";
    const arr = byEvaluator.get(key) || [];
    arr.push(exactRating(v));
    byEvaluator.set(key, arr);
  }
  const evaluators = [...byEvaluator.entries()]
    .map(([name, ratings]) => ({ name, visits: ratings.length, rating: r1(avg(ratings)), score: Math.round((avg(ratings) / 5) * 100) }))
    .sort((a, b) => b.visits - a.visits);

  return {
    period: { from, to },
    total: list.length,
    criteria: CRITERIA,
    matrix,
    totals: { visits: list.length, scores: critAvg(list), score: list.length ? Math.round((avg(list.map(exactRating)) / 5) * 100) : null },
    distribution,
    evaluators,
  };
}