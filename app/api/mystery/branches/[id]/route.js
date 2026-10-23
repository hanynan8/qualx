// PUT: تعديل فرع. DELETE: حذف فرع (لو عليه زيارات لازم ?cascade=1 فيمسحهم معاه).
import { MsBranch, MsVisit, MsAction, mysteryAuth, json, readJson, isId, serializeBranch } from "../../../../lib/mysteryDb";
import { validateBranch } from "../../../../lib/mysteryShopping";

export async function PUT(request, { params }) {
  try {
    const auth = await mysteryAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);

    const parsed = validateBranch(await readJson(request));
    if (parsed.error) return json({ error: parsed.error }, 400);

    const dup = await MsBranch()
      .findOne({ owner: auth.userId, name: parsed.value.name, _id: { $ne: id } })
      .collation({ locale: "en", strength: 2 })
      .lean();
    if (dup) return json({ error: "branch_exists" }, 409);

    const updated = await MsBranch().findOneAndUpdate({ _id: id, owner: auth.userId }, { $set: parsed.value }, { new: true });
    if (!updated) return json({ error: "not_found" }, 404);
    return json({ item: serializeBranch(updated) });
  } catch (err) {
    console.error("[/api/mystery/branches/:id] PUT:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await mysteryAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);

    const branch = await MsBranch().findOne({ _id: id, owner: auth.userId }).lean();
    if (!branch) return json({ error: "not_found" }, 404);

    const visits = await MsVisit().countDocuments({ owner: auth.userId, branchId: id });
    const cascade = new URL(request.url).searchParams.get("cascade") === "1";
    if (visits > 0 && !cascade) return json({ error: "branch_has_visits", visits }, 409);

    if (visits > 0) await MsVisit().deleteMany({ owner: auth.userId, branchId: id });
    await MsAction().updateMany({ owner: auth.userId, branchId: id }, { $set: { branchId: null } });
    await MsBranch().deleteOne({ _id: id, owner: auth.userId });
    return json({ ok: true, deletedVisits: visits });
  } catch (err) {
    console.error("[/api/mystery/branches/:id] DELETE:", err);
    return json({ error: "internal_error" }, 500);
  }
}
