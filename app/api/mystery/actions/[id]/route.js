// PUT: تعديل إجراء / تغيير حالته. DELETE: حذف.
import { MsAction, MsBranch, mysteryAuth, json, readJson, isId, serializeAction } from "../../../../lib/mysteryDb";
import { validateAction } from "../../../../lib/mysteryShopping";

export async function PUT(request, { params }) {
  try {
    const auth = await mysteryAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);

    const parsed = validateAction(await readJson(request));
    if (parsed.error) return json({ error: parsed.error }, 400);
    const { value } = parsed;
    if (value.branchId) {
      if (!isId(value.branchId) || !(await MsBranch().exists({ _id: value.branchId, owner: auth.userId }))) {
        return json({ error: "branch_not_found" }, 404);
      }
    }
    const updated = await MsAction().findOneAndUpdate({ _id: id, owner: auth.userId }, { $set: value }, { new: true });
    if (!updated) return json({ error: "not_found" }, 404);
    return json({ item: serializeAction(updated) });
  } catch (err) {
    console.error("[/api/mystery/actions/:id] PUT:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await mysteryAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);
    const res = await MsAction().deleteOne({ _id: id, owner: auth.userId });
    if (!res.deletedCount) return json({ error: "not_found" }, 404);
    return json({ ok: true });
  } catch (err) {
    console.error("[/api/mystery/actions/:id] DELETE:", err);
    return json({ error: "internal_error" }, 500);
  }
}
