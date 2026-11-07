// app/api/admin/career-applications/route.js — صندوق موحّد لطلبات التقديم على كل الوظائف (admin/hr).
//   GET ?status=under_review|accepted|rejected|withdrawn|all (الافتراضي under_review)
// القبول/الرفض نفسه بيتم من /api/admin/career-jobs/[jobId]/applications (PATCH).
import { connectToMongo } from "../../../lib/mongodb";
import { adminGuard, adminJson as json } from "../../../lib/careerAdmin";
import { getCareerAccountModel } from "../../../lib/careerAuth";
import { getCareerJobModel, getCareerApplicationModel, APPLICATION_STATUSES } from "../../../lib/careerJobs";

const MAX_ROWS = 500;

export async function GET(request) {
  try {
    const g = await adminGuard(request, "admin:career-inbox:list");
    if (g.response) return g.response;

    const statusParam = new URL(request.url).searchParams.get("status") || "under_review";
    if (statusParam !== "all" && !APPLICATION_STATUSES.includes(statusParam)) return json({ error: "invalid_status" }, 400);

    await connectToMongo();
    const filter = statusParam === "all" ? {} : { status: statusParam };
    const Application = getCareerApplicationModel();
    const [rows, total] = await Promise.all([
      Application.find(filter).sort({ appliedAt: -1 }).limit(MAX_ROWS).lean(),
      Application.countDocuments(filter),
    ]);

    const [accounts, jobs] = await Promise.all([
      getCareerAccountModel().find({ _id: { $in: rows.map((r) => r.accountId) } }, "name email phone").lean(),
      getCareerJobModel().find({ _id: { $in: rows.map((r) => r.jobId) } }, "title client status").lean(),
    ]);
    const accById = new Map(accounts.map((a) => [String(a._id), a]));
    const jobById = new Map(jobs.map((j) => [String(j._id), j]));

    return json({
      total,
      items: rows.map((r) => {
        const a = accById.get(String(r.accountId));
        const j = jobById.get(String(r.jobId));
        return {
          jobId: String(r.jobId),
          jobTitle: j?.title || "(deleted job)",
          client: j?.client || "",
          accountId: String(r.accountId),
          name: a?.name || "",
          email: a?.email || "",
          phone: a?.phone || "",
          status: r.status,
          proposedDate: r.proposedDate || "",
          note: r.note || "",
          appliedAt: r.appliedAt,
        };
      }),
    });
  } catch (err) {
    console.error("[admin/career-applications] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
