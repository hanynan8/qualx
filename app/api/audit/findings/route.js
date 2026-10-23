// GET: الملاحظات (فلترة بالحالة/الخطورة/المجال/الفرع + بحث + متأخرة + ترقيم) مع عدّادات الحالات.
// POST: ملاحظة يدوية جديدة (المهلة بتتحسب من الخطورة لو ما اتحددتش).
import { AuBranch, AuFinding, auditAuth, json, readJson, isId, serializeFinding, loadSettings } from "../../../lib/auditDb";
import { validateFinding, parseDay, toDay, addDays, AREAS, SEVERITIES, FINDING_STATUSES, LIMITS } from "../../../lib/auditing";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const dayRe = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request) {
  try {
    const auth = await auditAuth(request);
    if (auth.response) return auth.response;
    const { userId } = auth;
    const sp = new URL(request.url).searchParams;
    const today = dayRe.test(sp.get("today") || "") ? sp.get("today") : toDay(new Date());

    // الفلاتر المشتركة (من غير الحالة) — عشان عدّادات الحالات تفضل ثابتة.
    const base = { owner: userId };
    const severity = sp.get("severity");
    if (severity) {
      if (!SEVERITIES.includes(severity)) return json({ error: "severity_invalid" }, 400);
      base.severity = severity;
    }
    const area = sp.get("area");
    if (area) {
      if (!AREAS.includes(area)) return json({ error: "area_invalid" }, 400);
      base.area = area;
    }
    const branchId = sp.get("branchId");
    if (branchId) {
      if (!isId(branchId)) return json({ error: "invalid_id" }, 400);
      base.branchId = branchId;
    }
    const q = (sp.get("q") || "").trim().slice(0, 80);
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      base.$or = [{ title: rx }, { note: rx }, { assignee: rx }];
    }

    const filter = { ...base };
    const status = sp.get("status");
    if (status) {
      if (!FINDING_STATUSES.includes(status)) return json({ error: "status_invalid" }, 400);
      filter.status = status;
    }
    if (sp.get("overdue") === "1") {
      filter.status = filter.status && filter.status !== "closed" ? filter.status : { $ne: "closed" };
      filter.dueDate = { $lt: parseDay(today) };
    }

    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "20", 10) || 20));
    const sevRank = { critical: 0, major: 1, minor: 2 };

    const [docs, total, byStatus, overdue] = await Promise.all([
      AuFinding().find(filter).sort({ openedAt: -1, createdAt: -1 }).limit(2000).lean(),
      AuFinding().countDocuments(filter),
      AuFinding().aggregate([{ $match: base }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      AuFinding().countDocuments({ ...base, status: { $ne: "closed" }, dueDate: { $lt: parseDay(today) } }),
    ]);
    // المفتوحة الأول (الأخطر فالأقدم)، والمقفولة في الآخر.
    docs.sort((a, b) => (a.status === "closed") - (b.status === "closed") || sevRank[a.severity] - sevRank[b.severity] || a.openedAt - b.openedAt);
    const items = docs.slice((page - 1) * limit, page * limit).map(serializeFinding);
    const c = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
    return json({
      items,
      total,
      page,
      limit,
      counts: { open: c.open || 0, in_progress: c.in_progress || 0, closed: c.closed || 0, overdue },
    });
  } catch (err) {
    console.error("[/api/audit/findings] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await auditAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { userId } = auth;

    const body = await readJson(request);
    const parsed = validateFinding(body);
    if (parsed.error) return json({ error: parsed.error }, 400);
    const { value } = parsed;

    if (value.branchId) {
      if (!isId(value.branchId)) return json({ error: "invalid_id" }, 400);
      if (!(await AuBranch().findOne({ _id: value.branchId, owner: userId }).lean())) return json({ error: "branch_not_found" }, 404);
    }
    if ((await AuFinding().countDocuments({ owner: userId })) >= LIMITS.findings) return json({ error: "limit_reached" }, 409);

    const today = toDay(new Date());
    if (!value.dueDate) {
      const settings = await loadSettings(userId);
      value.dueDate = parseDay(addDays(today, settings.sla[value.severity]));
    }
    const created = await AuFinding().create({
      owner: userId,
      ...value,
      openedAt: parseDay(today),
      closedAt: value.status === "closed" ? parseDay(today) : null,
    });
    return json({ item: serializeFinding(created) }, 201);
  } catch (err) {
    console.error("[/api/audit/findings] POST:", err);
    return json({ error: "internal_error" }, 500);
  }
}
