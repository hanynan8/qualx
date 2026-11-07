// app/api/admin/career-jobs/[id]/assignments/route.js — تكليف حسابات كارير بوظيفة (admin-only).
// الوظيفة بتظهر في "My Jobs" عند الحساب المكلّف.
//   GET    → المكلّفين
//   POST   { email, status? } → تكليف (الحساب لازم يكون مسجّل في بوابة الكارير)
//   PATCH  { accountId, status } → تغيير حالة التكليف
//   DELETE { accountId } → إلغاء التكليف
import mongoose from "mongoose";
import { connectToMongo } from "../../../../../lib/mongodb";
import { requireRole, CAREER_ROLES } from "../../../../../lib/rbac";
import { enforceRateLimit } from "../../../../../lib/rateLimit";
import { logAudit } from "../../../../../lib/auditLog";
import { getCareerAccountModel } from "../../../../../lib/careerAuth";
import { getCareerJobModel, getCareerAssignmentModel, ASSIGNMENT_STATUSES } from "../../../../../lib/careerJobs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function guard(request, keyPrefix) {
  const auth = await requireRole(CAREER_ROLES);
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

async function loadJob(params) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return { error: json({ error: "invalid_id" }, 400) };
  await connectToMongo();
  const job = await getCareerJobModel().findById(id, "title").lean();
  if (!job) return { error: json({ error: "not_found" }, 404) };
  return { job };
}

export async function GET(request, { params }) {
  try {
    const g = await guard(request, "admin:career-assign:list");
    if (g.response) return g.response;
    const { job, error } = await loadJob(params);
    if (error) return error;

    const rows = await getCareerAssignmentModel().find({ jobId: job._id }).sort({ assignedAt: -1 }).lean();
    const accounts = await getCareerAccountModel()
      .find({ _id: { $in: rows.map((r) => r.accountId) } }, "name email phone")
      .lean();
    const byId = new Map(accounts.map((a) => [String(a._id), a]));

    return json({
      items: rows.map((r) => ({
        accountId: String(r.accountId),
        name: byId.get(String(r.accountId))?.name || "",
        email: byId.get(String(r.accountId))?.email || "",
        status: r.status,
        assignedAt: r.assignedAt,
      })),
    });
  } catch (err) {
    console.error("[admin/career-assign] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function POST(request, { params }) {
  try {
    const g = await guard(request, "admin:career-assign:create");
    if (g.response) return g.response;
    const { job, error } = await loadJob(params);
    if (error) return error;

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const status = body?.status === undefined ? "assigned" : body.status;
    if (!email || email.length > 254) return json({ error: "invalid_email" }, 400);
    if (!ASSIGNMENT_STATUSES.includes(status)) return json({ error: "invalid_status" }, 400);

    const account = await getCareerAccountModel().findOne({ email }, "name email").lean();
    if (!account) return json({ error: "account_not_found" }, 404);

    try {
      await getCareerAssignmentModel().create({ jobId: job._id, accountId: account._id, status });
    } catch (err) {
      if (err?.code === 11000) return json({ error: "already_assigned" }, 409);
      throw err;
    }

    await logAudit({
      request,
      actor: g.session.user,
      action: "career.job_assigned",
      targetId: String(job._id),
      targetEmail: account.email,
      details: { title: job.title },
    });
    return json({ ok: true, accountId: String(account._id) }, 201);
  } catch (err) {
    console.error("[admin/career-assign] POST error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const g = await guard(request, "admin:career-assign:patch");
    if (g.response) return g.response;
    const { job, error } = await loadJob(params);
    if (error) return error;

    const body = await request.json().catch(() => null);
    if (!mongoose.isValidObjectId(body?.accountId)) return json({ error: "invalid_id" }, 400);
    if (!ASSIGNMENT_STATUSES.includes(body?.status)) return json({ error: "invalid_status" }, 400);

    const updated = await getCareerAssignmentModel().findOneAndUpdate(
      { jobId: job._id, accountId: body.accountId },
      { $set: { status: body.status } },
      { new: true }
    );
    if (!updated) return json({ error: "not_found" }, 404);
    await logAudit({ request, actor: g.session.user, action: "career.assignment_updated", targetId: String(job._id), details: { status: body.status } });
    return json({ ok: true });
  } catch (err) {
    console.error("[admin/career-assign] PATCH error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const g = await guard(request, "admin:career-assign:delete");
    if (g.response) return g.response;
    const { job, error } = await loadJob(params);
    if (error) return error;

    const body = await request.json().catch(() => null);
    if (!mongoose.isValidObjectId(body?.accountId)) return json({ error: "invalid_id" }, 400);

    const res = await getCareerAssignmentModel().deleteOne({ jobId: job._id, accountId: body.accountId });
    if (!res.deletedCount) return json({ error: "not_found" }, 404);
    await logAudit({ request, actor: g.session.user, action: "career.assignment_removed", targetId: String(job._id) });
    return json({ ok: true });
  } catch (err) {
    console.error("[admin/career-assign] DELETE error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
