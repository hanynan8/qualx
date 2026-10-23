// PUT: تعديل فرع. DELETE: حذف فرع (لو عليه زيارات لازم ?cascade=1 فيمسح الزيارات وملاحظاتها معاه).
import { AuBranch, AuVisit, AuFinding, auditAuth, json, readJson, isId, serializeBranch } from "../../../../lib/auditDb";
import { validateBranch } from "../../../../lib/auditing";

export async function PUT(request, { params }) {
  try {
    const auth = await auditAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);

    const parsed = validateBranch(await readJson(request));
    if (parsed.error) return json({ error: parsed.error }, 400);
    const dup = await AuBranch().findOne({ owner: auth.userId, name: parsed.value.name, _id: { $ne: id } }).collation({ locale: "en", strength: 2 }).lean();
    if (dup) return json({ error: "branch_exists" }, 409);

    const updated = await AuBranch().findOneAndUpdate({ _id: id, owner: auth.userId }, { $set: parsed.value }, { new: true });
    if (!updated) return json({ error: "not_found" }, 404);
    return json({ item: serializeBranch(updated) });
  } catch (err) {
    console.error("[/api/audit/branches/:id] PUT:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await auditAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);
    const { userId } = auth;

    if (!(await AuBranch().findOne({ _id: id, owner: userId }).lean())) return json({ error: "not_found" }, 404);
    const visits = await AuVisit().countDocuments({ owner: userId, branchId: id });
    const cascade = new URL(request.url).searchParams.get("cascade") === "1";
    if (visits > 0 && !cascade) return json({ error: "branch_has_visits", visits }, 409);

    if (visits > 0) {
      await AuVisit().deleteMany({ owner: userId, branchId: id });
      await AuFinding().deleteMany({ owner: userId, branchId: id, visitId: { $ne: null } });
    }
    await AuFinding().updateMany({ owner: userId, branchId: id }, { $set: { branchId: null } }); // اليدوية بتفضل من غير فرع
    await AuBranch().deleteOne({ _id: id, owner: userId });
    return json({ ok: true, deletedVisits: visits });
  } catch (err) {
    console.error("[/api/audit/branches/:id] DELETE:", err);
    return json({ error: "internal_error" }, 500);
  }
}
