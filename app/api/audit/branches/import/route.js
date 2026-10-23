// POST: استيراد فروع الميستري شوبنج (اللي مش موجودة بنفس الاسم) كفروع تدقيق.
import { AuBranch, auditAuth, json } from "../../../../lib/auditDb";
import { MsBranch } from "../../../../lib/mysteryDb";
import { LIMITS } from "../../../../lib/auditing";

export async function POST(request) {
  try {
    const auth = await auditAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { userId } = auth;

    const [source, mine] = await Promise.all([MsBranch().find({ owner: userId }).lean(), AuBranch().find({ owner: userId }, "name").lean()]);
    const have = new Set(mine.map((b) => b.name.trim().toLowerCase()));
    const fresh = source.filter((b) => !have.has(b.name.trim().toLowerCase())).slice(0, Math.max(0, LIMITS.branches - mine.length));
    if (fresh.length) {
      await AuBranch().insertMany(fresh.map((b) => ({ owner: userId, name: b.name, city: b.city || "", status: b.status || "active" })));
    }
    return json({ imported: fresh.length });
  } catch (err) {
    console.error("[/api/audit/branches/import] POST:", err);
    return json({ error: "internal_error" }, 500);
  }
}
