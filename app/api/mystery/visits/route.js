// GET: زيارات المستخدم (فلترة بالتاريخ/الحالة/الفرع + بحث + ترقيم صفحات).
// POST: زيارة جديدة (مجدولة أو مكتملة بتقييمها).
import { MsBranch, MsVisit, mysteryAuth, json, readJson, isId, serializeVisit } from "../../../lib/mysteryDb";
import { validateVisit, parseDay, VISIT_STATUSES, LIMITS } from "../../../lib/mysteryShopping";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request) {
  try {
    const auth = await mysteryAuth(request);
    if (auth.response) return auth.response;
    const { userId } = auth;
    const sp = new URL(request.url).searchParams;

    const filter = { owner: userId };
    const from = sp.get("from");
    const to = sp.get("to");
    if (from || to) {
      filter.date = {};
      if (from) {
        const d = parseDay(from);
        if (!d) return json({ error: "date_invalid" }, 400);
        filter.date.$gte = d;
      }
      if (to) {
        const d = parseDay(to);
        if (!d) return json({ error: "date_invalid" }, 400);
        filter.date.$lte = d;
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
      filter.$or = [{ evaluator: rx }, { notes: rx }];
    }

    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "20", 10) || 20));

    const [docs, total] = await Promise.all([
      MsVisit().find(filter).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      MsVisit().countDocuments(filter),
    ]);
    return json({ items: docs.map(serializeVisit), total, page, limit });
  } catch (err) {
    console.error("[/api/mystery/visits] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await mysteryAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { userId } = auth;

    const parsed = validateVisit(await readJson(request));
    if (parsed.error) return json({ error: parsed.error }, 400);
    const { value } = parsed;

    if (!isId(value.branchId)) return json({ error: "invalid_id" }, 400);
    const branch = await MsBranch().findOne({ _id: value.branchId, owner: userId }).lean();
    if (!branch) return json({ error: "branch_not_found" }, 404);

    if ((await MsVisit().countDocuments({ owner: userId })) >= LIMITS.visits) {
      return json({ error: "limit_reached" }, 409);
    }
    const created = await MsVisit().create({ owner: userId, ...value });
    return json({ item: serializeVisit(created) }, 201);
  } catch (err) {
    console.error("[/api/mystery/visits] POST:", err);
    return json({ error: "internal_error" }, 500);
  }
}
