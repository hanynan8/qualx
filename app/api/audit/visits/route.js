// GET: زيارات التدقيق (فلترة بالتاريخ/الحالة/الفرع + بحث + ترقيم صفحات).
// POST: زيارة جديدة (مجدولة / مكتملة بقايمة فحص). الزيارة المكتملة بتولّد ملاحظات من البنود غير المطابقة.
import { AuBranch, AuVisit, auditAuth, json, readJson, isId, serializeVisit, loadSettings, syncVisitFindings } from "../../../lib/auditDb";
import { validateVisit, parseDay, VISIT_STATUSES, LIMITS } from "../../../lib/auditing";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request) {
  try {
    const auth = await auditAuth(request);
    if (auth.response) return auth.response;
    const sp = new URL(request.url).searchParams;
    const filter = { owner: auth.userId };

    const from = sp.get("from");
    const to = sp.get("to");
    if (from || to) {
      filter.date = {};
      for (const [k, v] of [["$gte", from], ["$lte", to]]) {
        if (!v) continue;
        const d = parseDay(v);
        if (!d) return json({ error: "date_invalid" }, 400);
        filter.date[k] = d;
      }
    }
    const status = sp.get("status");
    if (status) {
      if (!VISIT_STATUSES.includes(status)) return json({ error: "status_invalid" }, 400);
      filter.status = status;
    }
    const branchId = sp.get("branchId");
    if (branchId) {
      if (!isId(branchId)) return json({ error: "invalid_id" }, 400);
      filter.branchId = branchId;
    }
    const q = (sp.get("q") || "").trim().slice(0, 80);
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ auditor: rx }, { notes: rx }, { "results.item": rx }];
    }

    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "20", 10) || 20));
    const [docs, total] = await Promise.all([
      AuVisit().find(filter).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuVisit().countDocuments(filter),
    ]);
    return json({ items: docs.map(serializeVisit), total, page, limit });
  } catch (err) {
    console.error("[/api/audit/visits] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await auditAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { userId } = auth;

    const parsed = validateVisit(await readJson(request, 256 * 1024));
    if (parsed.error) return json({ error: parsed.error }, 400);
    const { value } = parsed;

    if (!isId(value.branchId)) return json({ error: "invalid_id" }, 400);
    if (!(await AuBranch().findOne({ _id: value.branchId, owner: userId }).lean())) return json({ error: "branch_not_found" }, 404);
    if ((await AuVisit().countDocuments({ owner: userId })) >= LIMITS.visits) return json({ error: "limit_reached" }, 409);

    const created = await AuVisit().create({ owner: userId, ...value });
    await syncVisitFindings(userId, created, await loadSettings(userId));
    return json({ item: serializeVisit(created) }, 201);
  } catch (err) {
    console.error("[/api/audit/visits] POST:", err);
    return json({ error: "internal_error" }, 500);
  }
}
