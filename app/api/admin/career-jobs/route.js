// app/api/admin/career-jobs/route.js — إدارة وظائف الكارير (admin-only).
// GET: كل الوظائف (مفتوحة ومقفولة) + عدد المكلّفين. POST: وظيفة جديدة.
import { connectToMongo } from "../../../lib/mongodb";
import { requireRole, CAREER_ROLES } from "../../../lib/rbac";
import { enforceRateLimit } from "../../../lib/rateLimit";
import { logAudit } from "../../../lib/auditLog";
import { getCareerJobModel, getCareerAssignmentModel, serializeJob, cleanJobInput } from "../../../lib/careerJobs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function GET(request) {
  try {
    const auth = await requireRole(CAREER_ROLES);
    if (auth.response) return auth.response;
    const rl = await enforceRateLimit(request, {
      keyPrefix: "admin:career-jobs:list",
      limit: 60,
      windowSeconds: 60,
      extraKey: `user:${auth.session.user.id}`,
    });
    if (rl) return rl;

    await connectToMongo();
    const jobs = await getCareerJobModel().find({}).sort({ createdAt: -1 }).limit(1000).lean();
    const counts = await getCareerAssignmentModel().aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: "$jobId", n: { $sum: 1 } } },
    ]);
    const byJob = new Map(counts.map((c) => [String(c._id), c.n]));

    return json({ items: jobs.map((j) => ({ ...serializeJob(j), assignedCount: byJob.get(String(j._id)) || 0 })) });
  } catch (err) {
    console.error("[admin/career-jobs] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(CAREER_ROLES);
    if (auth.response) return auth.response;
    const rl = await enforceRateLimit(request, {
      keyPrefix: "admin:career-jobs:create",
      limit: 30,
      windowSeconds: 60,
      extraKey: `user:${auth.session.user.id}`,
    });
    if (rl) return rl;

    const body = await request.json().catch(() => null);
    const { data, error } = cleanJobInput(body);
    if (error) return json({ error }, 400);

    await connectToMongo();
    const created = await getCareerJobModel().create(data);
    await logAudit({
      request,
      actor: auth.session.user,
      action: "career.job_created",
      targetId: String(created._id),
      details: { title: created.title },
    });
    return json(serializeJob(created), 201);
  } catch (err) {
    console.error("[admin/career-jobs] POST error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
