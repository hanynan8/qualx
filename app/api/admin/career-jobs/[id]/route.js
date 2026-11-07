// app/api/admin/career-jobs/[id]/route.js — تعديل/حذف وظيفة (admin-only).
// حذف الوظيفة بيحذف تكليفاتها كمان.
import mongoose from "mongoose";
import { connectToMongo } from "../../../../lib/mongodb";
import { requireRole } from "../../../../lib/rbac";
import { enforceRateLimit } from "../../../../lib/rateLimit";
import { logAudit } from "../../../../lib/auditLog";
import { getCareerJobModel, getCareerAssignmentModel, serializeJob, cleanJobInput } from "../../../../lib/careerJobs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function guard(request, keyPrefix) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return { response: auth.response };
  const rl = await enforceRateLimit(request, {
    keyPrefix,
    limit: 60,
    windowSeconds: 60,
    extraKey: `user:${auth.session.user.id}`,
  });
  if (rl) return { response: rl };
  return { session: auth.session };
}

export async function PATCH(request, { params }) {
  try {
    const g = await guard(request, "admin:career-jobs:patch");
    if (g.response) return g.response;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return json({ error: "invalid_id" }, 400);

    const body = await request.json().catch(() => null);
    const { data, error } = cleanJobInput(body, { partial: true });
    if (error) return json({ error }, 400);
    if (!Object.keys(data).length) return json({ error: "nothing_to_update" }, 400);

    await connectToMongo();
    const updated = await getCareerJobModel().findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    if (!updated) return json({ error: "not_found" }, 404);

    await logAudit({ request, actor: g.session.user, action: "career.job_updated", targetId: id, details: { fields: Object.keys(data) } });
    return json(serializeJob(updated));
  } catch (err) {
    console.error("[admin/career-jobs/:id] PATCH error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const g = await guard(request, "admin:career-jobs:delete");
    if (g.response) return g.response;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return json({ error: "invalid_id" }, 400);

    await connectToMongo();
    const deleted = await getCareerJobModel().findByIdAndDelete(id);
    if (!deleted) return json({ error: "not_found" }, 404);
    await getCareerAssignmentModel().deleteMany({ jobId: deleted._id });

    await logAudit({ request, actor: g.session.user, action: "career.job_deleted", targetId: id, details: { title: deleted.title } });
    return json({ ok: true });
  } catch (err) {
    console.error("[admin/career-jobs/:id] DELETE error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
