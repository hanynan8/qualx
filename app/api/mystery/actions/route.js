// GET: الإجراءات التصحيحية (?status=open|in_progress|done). POST: إجراء جديد.
import { MsAction, MsBranch, mysteryAuth, json, readJson, isId, serializeAction } from "../../../lib/mysteryDb";
import { validateAction, ACTION_STATUSES, LIMITS } from "../../../lib/mysteryShopping";

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export async function GET(request) {
  try {
    const auth = await mysteryAuth(request);
    if (auth.response) return auth.response;
    const filter = { owner: auth.userId };
    const status = new URL(request.url).searchParams.get("status");
    if (status) {
      if (!ACTION_STATUSES.includes(status)) return json({ error: "status_invalid" }, 400);
      filter.status = status;
    }
    const docs = await MsAction().find(filter).sort({ createdAt: -1 }).limit(2000).lean();
    const items = docs.map(serializeAction).sort((a, b) => {
      const done = Number(a.status === "done") - Number(b.status === "done");
      return done || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    });
    return json({ items });
  } catch (err) {
    console.error("[/api/mystery/actions] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await mysteryAuth(request, { write: true });
    if (auth.response) return auth.response;
    const parsed = validateAction(await readJson(request));
    if (parsed.error) return json({ error: parsed.error }, 400);
    const { value } = parsed;

    if (value.branchId) {
      if (!isId(value.branchId) || !(await MsBranch().exists({ _id: value.branchId, owner: auth.userId }))) {
        return json({ error: "branch_not_found" }, 404);
      }
    }
    if ((await MsAction().countDocuments({ owner: auth.userId })) >= LIMITS.actions) {
      return json({ error: "limit_reached" }, 409);
    }
    const created = await MsAction().create({ owner: auth.userId, ...value });
    return json({ item: serializeAction(created) }, 201);
  } catch (err) {
    console.error("[/api/mystery/actions] POST:", err);
    return json({ error: "internal_error" }, 500);
  }
}
