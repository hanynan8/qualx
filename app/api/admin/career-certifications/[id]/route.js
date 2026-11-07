// app/api/admin/career-certifications/[id]/route.js — تعديل/حذف شهادة (admin-only).
import mongoose from "mongoose";
import { connectToMongo } from "../../../../lib/mongodb";
import { logAudit } from "../../../../lib/auditLog";
import { adminGuard, adminJson as json } from "../../../../lib/careerAdmin";
import { getCertModel, getCertProgressModel, cleanCert } from "../../../../lib/careerExtras";

export async function PATCH(request, { params }) {
  try {
    const g = await adminGuard(request, "admin:career-certs:patch");
    if (g.response) return g.response;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return json({ error: "invalid_id" }, 400);
    const { data, error } = cleanCert(await request.json().catch(() => null), true);
    if (error) return json({ error }, 400);
    await connectToMongo();
    const doc = await getCertModel().findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!doc) return json({ error: "not_found" }, 404);
    await logAudit({ request, actor: g.session.user, action: "career.cert_updated", targetId: id });
    return json({ ok: true });
  } catch (err) {
    console.error("[admin/career-certs] PATCH error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const g = await adminGuard(request, "admin:career-certs:delete", 20);
    if (g.response) return g.response;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return json({ error: "invalid_id" }, 400);
    await connectToMongo();
    const res = await getCertModel().deleteOne({ _id: id });
    if (!res.deletedCount) return json({ error: "not_found" }, 404);
    await getCertProgressModel().deleteMany({ certId: id });
    await logAudit({ request, actor: g.session.user, action: "career.cert_deleted", targetId: id });
    return json({ ok: true });
  } catch (err) {
    console.error("[admin/career-certs] DELETE error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
