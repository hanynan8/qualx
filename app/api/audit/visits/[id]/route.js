// PUT: تعديل زيارة (بما فيه تحويل مجدولة → مكتملة) وإعادة مزامنة ملاحظاتها. DELETE: حذف الزيارة + ملاحظاتها.
import { AuBranch, AuVisit, AuFinding, auditAuth, json, readJson, isId, serializeVisit, loadSettings, syncVisitFindings } from "../../../../lib/auditDb";
import { validateVisit } from "../../../../lib/auditing";

export async function PUT(request, { params }) {
  try {
    const auth = await auditAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);

    const parsed = validateVisit(await readJson(request, 256 * 1024));
    if (parsed.error) return json({ error: parsed.error }, 400);
    const { value } = parsed;

    if (!isId(value.branchId)) return json({ error: "invalid_id" }, 400);
    if (!(await AuBranch().findOne({ _id: value.branchId, owner: auth.userId }).lean())) return json({ error: "branch_not_found" }, 404);

    const updated = await AuVisit().findOneAndUpdate({ _id: id, owner: auth.userId }, { $set: value }, { new: true });
    if (!updated) return json({ error: "not_found" }, 404);
    await syncVisitFindings(auth.userId, updated, await loadSettings(auth.userId));
    return json({ item: serializeVisit(updated) });
  } catch (err) {
    console.error("[/api/audit/visits/:id] PUT:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await auditAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);
    const res = await AuVisit().deleteOne({ _id: id, owner: auth.userId });
    if (!res.deletedCount) return json({ error: "not_found" }, 404);
    await AuFinding().deleteMany({ owner: auth.userId, visitId: id });
    return json({ ok: true });
  } catch (err) {
    console.error("[/api/audit/visits/:id] DELETE:", err);
    return json({ error: "internal_error" }, 500);
  }
}
