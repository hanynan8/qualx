// GET: فروع المستخدم + إحصائيات (عدد الزيارات، آخر زيارة ونتيجتها، الملاحظات المفتوحة). POST: فرع جديد.
import { AuBranch, AuVisit, AuFinding, auditAuth, json, readJson, serializeBranch } from "../../../lib/auditDb";
import { validateBranch, LIMITS } from "../../../lib/auditing";

export async function GET(request) {
  try {
    const auth = await auditAuth(request);
    if (auth.response) return auth.response;
    const { userId } = auth;

    const [branches, visits, openCounts] = await Promise.all([
      AuBranch().find({ owner: userId }).sort({ name: 1 }).limit(500).lean(),
      AuVisit().find({ owner: userId }, "branchId date status compliance").sort({ date: -1 }).limit(20000).lean(),
      AuFinding().aggregate([{ $match: { owner: userId, status: { $ne: "closed" } } }, { $group: { _id: "$branchId", count: { $sum: 1 } } }]),
    ]);
    const open = new Map(openCounts.map((c) => [c._id, c.count]));
    const stats = new Map();
    for (const v of visits) {
      const s = stats.get(v.branchId) || { visits: 0, lastAudit: null, lastScore: null };
      s.visits += 1;
      // visits مرتبة تنازليًا: أول زيارة مكتملة هي الأحدث.
      if (v.status === "completed" && !s.lastAudit) {
        s.lastAudit = v.date.toISOString().slice(0, 10);
        s.lastScore = v.compliance ?? null;
      }
      stats.set(v.branchId, s);
    }
    return json({
      items: branches.map((b) => {
        const id = String(b._id);
        const s = stats.get(id) || { visits: 0, lastAudit: null, lastScore: null };
        return { ...serializeBranch(b), ...s, openFindings: open.get(id) || 0 };
      }),
    });
  } catch (err) {
    console.error("[/api/audit/branches] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await auditAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { userId } = auth;

    const parsed = validateBranch(await readJson(request));
    if (parsed.error) return json({ error: parsed.error }, 400);
    if ((await AuBranch().countDocuments({ owner: userId })) >= LIMITS.branches) return json({ error: "limit_reached" }, 409);
    const dup = await AuBranch().findOne({ owner: userId, name: parsed.value.name }).collation({ locale: "en", strength: 2 }).lean();
    if (dup) return json({ error: "branch_exists" }, 409);

    const created = await AuBranch().create({ owner: userId, ...parsed.value });
    return json({ item: { ...serializeBranch(created), visits: 0, lastAudit: null, lastScore: null, openFindings: 0 } }, 201);
  } catch (err) {
    console.error("[/api/audit/branches] POST:", err);
    return json({ error: "internal_error" }, 500);
  }
}
