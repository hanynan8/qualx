// GET: فروع المستخدم (مع عدد زياراتها). POST: فرع جديد.
import { MsBranch, MsVisit, mysteryAuth, json, readJson, serializeBranch } from "../../../lib/mysteryDb";
import { validateBranch, LIMITS } from "../../../lib/mysteryShopping";

export async function GET(request) {
  try {
    const auth = await mysteryAuth(request);
    if (auth.response) return auth.response;
    const { userId } = auth;

    const [branches, counts] = await Promise.all([
      MsBranch().find({ owner: userId }).sort({ name: 1 }).limit(500).lean(),
      MsVisit().aggregate([{ $match: { owner: userId } }, { $group: { _id: "$branchId", count: { $sum: 1 } } }]),
    ]);
    const byId = new Map(counts.map((c) => [c._id, c.count]));
    return json({ items: branches.map((b) => ({ ...serializeBranch(b), visits: byId.get(String(b._id)) || 0 })) });
  } catch (err) {
    console.error("[/api/mystery/branches] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await mysteryAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { userId } = auth;

    const parsed = validateBranch(await readJson(request));
    if (parsed.error) return json({ error: parsed.error }, 400);

    if ((await MsBranch().countDocuments({ owner: userId })) >= LIMITS.branches) {
      return json({ error: "limit_reached" }, 409);
    }
    const dup = await MsBranch().findOne({ owner: userId, name: parsed.value.name }).collation({ locale: "en", strength: 2 }).lean();
    if (dup) return json({ error: "branch_exists" }, 409);

    const created = await MsBranch().create({ owner: userId, ...parsed.value });
    return json({ item: { ...serializeBranch(created), visits: 0 } }, 201);
  } catch (err) {
    console.error("[/api/mystery/branches] POST:", err);
    return json({ error: "internal_error" }, 500);
  }
}
