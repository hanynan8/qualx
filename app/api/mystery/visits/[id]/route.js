// PUT: تعديل زيارة (بما فيه تحويل مجدولة → مكتملة بالتقييم). DELETE: حذف.
import { MsBranch, MsVisit, mysteryAuth, json, readJson, isId, serializeVisit } from "../../../../lib/mysteryDb";
import { validateVisit } from "../../../../lib/mysteryShopping";

export async function PUT(request, { params }) {
  try {
    const auth = await mysteryAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);

    const parsed = validateVisit(await readJson(request));
    if (parsed.error) return json({ error: parsed.error }, 400);
    const { value } = parsed;

    if (!isId(value.branchId)) return json({ error: "invalid_id" }, 400);
    const branch = await MsBranch().findOne({ _id: value.branchId, owner: auth.userId }).lean();
    if (!branch) return json({ error: "branch_not_found" }, 404);

    const updated = await MsVisit().findOneAndUpdate({ _id: id, owner: auth.userId }, { $set: value }, { new: true });
    if (!updated) return json({ error: "not_found" }, 404);
    return json({ item: serializeVisit(updated) });
  } catch (err) {
    console.error("[/api/mystery/visits/:id] PUT:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await mysteryAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);
    const res = await MsVisit().deleteOne({ _id: id, owner: auth.userId });
    if (!res.deletedCount) return json({ error: "not_found" }, 404);
    return json({ ok: true });
  } catch (err) {
    console.error("[/api/mystery/visits/:id] DELETE:", err);
    return json({ error: "internal_error" }, 500);
  }
}
