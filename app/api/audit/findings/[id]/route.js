// PUT: تعديل ملاحظة (الحالة/المسؤول/المهلة/الحل، والعنوان والمجال والخطورة لليدوية بس). DELETE: حذف.
import { AuBranch, AuFinding, auditAuth, json, readJson, isId, serializeFinding } from "../../../../lib/auditDb";
import { validateFinding, parseDay, toDay } from "../../../../lib/auditing";

export async function PUT(request, { params }) {
  try {
    const auth = await auditAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);
    const { userId } = auth;

    const current = await AuFinding().findOne({ _id: id, owner: userId });
    if (!current) return json({ error: "not_found" }, 404);

    const parsed = validateFinding(await readJson(request), { locked: Boolean(current.visitId) });
    if (parsed.error) return json({ error: parsed.error }, 400);
    const { value } = parsed;

    if (value.branchId) {
      if (!isId(value.branchId)) return json({ error: "invalid_id" }, 400);
      if (!(await AuBranch().findOne({ _id: value.branchId, owner: userId }).lean())) return json({ error: "branch_not_found" }, 404);
    }
    // تاريخ الإغلاق: بيتسجّل أول ما الحالة تبقى "مقفولة" وبيتمسح لو اتفتحت تاني.
    if (value.status === "closed") value.closedAt = current.closedAt || parseDay(toDay(new Date()));
    else value.closedAt = null;

    current.set(value);
    await current.save();
    return json({ item: serializeFinding(current) });
  } catch (err) {
    console.error("[/api/audit/findings/:id] PUT:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await auditAuth(request, { write: true });
    if (auth.response) return auth.response;
    const { id } = await params;
    if (!isId(id)) return json({ error: "invalid_id" }, 400);
    const res = await AuFinding().deleteOne({ _id: id, owner: auth.userId });
    if (!res.deletedCount) return json({ error: "not_found" }, 404);
    return json({ ok: true });
  } catch (err) {
    console.error("[/api/audit/findings/:id] DELETE:", err);
    return json({ error: "internal_error" }, 500);
  }
}
