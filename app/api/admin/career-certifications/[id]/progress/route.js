// app/api/admin/career-certifications/[id]/progress/route.js — اعتماد/تعديل تقدّم شخص في شهادة (admin-only).
//   PATCH { email, status: "in_progress" | "completed" }
import mongoose from "mongoose";
import { connectToMongo } from "../../../../../lib/mongodb";
import { logAudit } from "../../../../../lib/auditLog";
import { adminGuard, adminJson as json } from "../../../../../lib/careerAdmin";
import { getCareerAccountModel } from "../../../../../lib/careerAuth";
import { getCertModel, getCertProgressModel, CERT_PROGRESS_STATUSES } from "../../../../../lib/careerExtras";

export async function PATCH(request, { params }) {
  try {
    const g = await adminGuard(request, "admin:career-certs:progress");
    if (g.response) return g.response;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return json({ error: "invalid_id" }, 400);
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254) return json({ error: "invalid_email" }, 400);
    if (!CERT_PROGRESS_STATUSES.includes(body?.status)) return json({ error: "invalid_status" }, 400);

    await connectToMongo();
    const [cert, account] = await Promise.all([
      getCertModel().findById(id, "title").lean(),
      getCareerAccountModel().findOne({ email }, "_id email").lean(),
    ]);
    if (!cert) return json({ error: "not_found" }, 404);
    if (!account) return json({ error: "account_not_found" }, 404);

    await getCertProgressModel().updateOne(
      { certId: cert._id, accountId: account._id },
      {
        $set: { status: body.status, completedAt: body.status === "completed" ? new Date() : null },
        $setOnInsert: { startedAt: new Date() },
      },
      { upsert: true }
    );
    await logAudit({
      request,
      actor: g.session.user,
      action: "career.cert_progress",
      targetId: id,
      targetEmail: account.email,
      details: { status: body.status, title: cert.title },
    });
    return json({ ok: true });
  } catch (err) {
    console.error("[admin/career-certs] progress error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
