// app/api/admin/career-jobs/[id]/applications/route.js — طلبات التقديم على وظيفة (admin-only).
//   GET   → المتقدّمين
//   PATCH { accountId, status: "accepted" | "rejected" | "under_review" }
//         "accepted" بيعمل تكليف تلقائي (الوظيفة بتظهر في My Jobs عند المتقدّم).
import mongoose from "mongoose";
import { connectToMongo } from "../../../../../lib/mongodb";
import { requireRole, CAREER_ROLES } from "../../../../../lib/rbac";
import { enforceRateLimit } from "../../../../../lib/rateLimit";
import { logAudit } from "../../../../../lib/auditLog";
import { getCareerAccountModel } from "../../../../../lib/careerAuth";
import { notify } from "../../../../../lib/email";
import {
  getCareerJobModel,
  getCareerAssignmentModel,
  getCareerApplicationModel,
} from "../../../../../lib/careerJobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

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
    const g = await guard(request, "admin:career-apps:list");
    if (g.response) return g.response;
    const { job, error } = await loadJob(params);
    if (error) return error;

    const rows = await getCareerApplicationModel().find({ jobId: job._id }).sort({ appliedAt: -1 }).lean();
    const accounts = await getCareerAccountModel()
      .find({ _id: { $in: rows.map((r) => r.accountId) } }, "name email phone")
      .lean();
    const byId = new Map(accounts.map((a) => [String(a._id), a]));
    return json({
      items: rows.map((r) => {
        const a = byId.get(String(r.accountId));
        return {
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
    console.error("[admin/career-apps] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const g = await guard(request, "admin:career-apps:patch");
    if (g.response) return g.response;
    const { job, error } = await loadJob(params);
    if (error) return error;

    const body = await request.json().catch(() => null);
    if (!mongoose.isValidObjectId(body?.accountId)) return json({ error: "invalid_id" }, 400);
    if (!["accepted", "rejected", "under_review"].includes(body?.status)) return json({ error: "invalid_status" }, 400);

    const app = await getCareerApplicationModel().findOneAndUpdate(
      { jobId: job._id, accountId: body.accountId, status: { $ne: "withdrawn" } },
      { $set: { status: body.status } },
      { new: true }
    );
    if (!app) return json({ error: "not_found" }, 404);

    const Assignment = getCareerAssignmentModel();
    if (body.status === "accepted") {
      // لو التكليف كان اتلغى قبل كده: نرجّعه "assigned" (من غير ده الطلب يبقى مقبول
      // والوظيفة ماتظهرش في My Jobs). غير كده: بنعمل تكليف جديد لو مش موجود.
      await Assignment.updateOne(
        { jobId: job._id, accountId: app.accountId, status: "cancelled" },
        { $set: { status: "assigned", assignedAt: new Date() } }
      );
      await Assignment.updateOne(
        { jobId: job._id, accountId: app.accountId },
        { $setOnInsert: { status: "assigned", assignedAt: new Date() } },
        { upsert: true }
      );
    } else {
      // رفض/إرجاع للمراجعة بعد القبول: نلغي التكليف لو لسه ما بدأش (assigned بس).
      // اللي اتبدأ/اتسلّم/اتكمّل مابنلمسوش عشان الشغل والمستحقات ما تضيعش.
      await Assignment.updateOne(
        { jobId: job._id, accountId: app.accountId, status: "assigned" },
        { $set: { status: "cancelled" } }
      );
    }
    await logAudit({
      request,
      actor: g.session.user,
      action: "career.application_updated",
      targetId: String(job._id),
      details: { status: body.status, title: job.title },
    });

    // إشعار بالإيميل للمتقدّم (لو Resend متظبط). فشل الإرسال مابيوقفش العملية.
    let emailed = false;
    if (body.status === "accepted" || body.status === "rejected") {
      const applicant = await getCareerAccountModel().findById(app.accountId, "name email").lean();
      if (applicant?.email) {
        const r = await notify(body.status === "accepted" ? "application_accepted" : "application_rejected", {
          to: applicant.email,
          name: applicant.name,
          jobTitle: job.title,
        });
        emailed = r.sent;
      }
    }
    return json({ ok: true, emailed });
  } catch (err) {
    console.error("[admin/career-apps] PATCH error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
