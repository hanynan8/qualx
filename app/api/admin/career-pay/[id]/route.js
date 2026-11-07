// app/api/admin/career-pay/[id]/route.js — اعتماد/رفض/تعديل بند مستحقات (admin-only).
//   PATCH { status?, compensation?, reimbursement?, note? }   DELETE
import mongoose from "mongoose";
import { connectToMongo } from "../../../../lib/mongodb";
import { logAudit } from "../../../../lib/auditLog";
import { adminGuard, adminJson as json } from "../../../../lib/careerAdmin";
import { getPayModel, PAY_STATUSES } from "../../../../lib/careerExtras";

export async function PATCH(request, { params }) {
  try {
    const g = await adminGuard(request, "admin:career-pay:patch", 120);
    if (g.response) return g.response;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return json({ error: "invalid_id" }, 400);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "invalid_body" }, 400);

    const set = {};
    if (body.status !== undefined) {
      if (!PAY_STATUSES.includes(body.status)) return json({ error: "invalid_status" }, 400);
      set.status = body.status;
    }
    for (const f of ["compensation", "reimbursement"]) {
      if (body[f] === undefined) continue;
      const n = Number(body[f]);
      if (!Number.isFinite(n) || n < 0 || n > 10_000_000) return json({ error: "invalid_amount" }, 400);
      set[f] = n;
    }
    if (body.note !== undefined) set.note = String(body.note).trim().slice(0, 500);
    if (!Object.keys(set).length) return json({ error: "nothing_to_update" }, 400);

    await connectToMongo();
    const doc = await getPayModel().findByIdAndUpdate(id, { $set: set }, { new: true });
    if (!doc) return json({ error: "not_found" }, 404);
    await logAudit({ request, actor: g.session.user, action: "career.pay_updated", targetId: id, details: set });
    return json({ ok: true });
  } catch (err) {
    console.error("[admin/career-pay] PATCH error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const g = await adminGuard(request, "admin:career-pay:delete", 30);
    if (g.response) return g.response;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return json({ error: "invalid_id" }, 400);
    await connectToMongo();
    const res = await getPayModel().deleteOne({ _id: id });
    if (!res.deletedCount) return json({ error: "not_found" }, 404);
    await logAudit({ request, actor: g.session.user, action: "career.pay_deleted", targetId: id });
    return json({ ok: true });
  } catch (err) {
    console.error("[admin/career-pay] DELETE error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
