// app/api/career/applications/route.js — طلبات التقديم لحساب الكارير الحالي (My Applications).
//   GET   [?jobId=]            → طلباتي (مع بيانات الوظيفة)
//   POST  { jobId, proposedDate?, note? } → تقديم على وظيفة مفتوحة
//   PATCH { jobId }            → سحب الطلب (لو لسه under_review)
// accountId دايمًا من الجلسة، مش من أي مدخل.
import mongoose from "mongoose";
import { connectToMongo } from "../../../lib/mongodb";
import { requireCareer, careerJson } from "../../../lib/careerAuth";
import { enforceRateLimit } from "../../../lib/rateLimit";
import {
  getCareerJobModel,
  getCareerAssignmentModel,
  getCareerApplicationModel,
  serializeJob,
} from "../../../lib/careerJobs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NOTE_MAX = 1000;

const serializeApp = (a) => ({
  status: a.status,
  proposedDate: a.proposedDate || "",
  note: a.note || "",
  appliedAt: a.appliedAt || a.createdAt,
});

export async function GET(request) {
  const { user, response } = await requireCareer();
  if (response) return response;
  try {
    await connectToMongo();
    const filter = { accountId: new mongoose.Types.ObjectId(user.id) };
    const jobId = new URL(request.url).searchParams.get("jobId");
    if (jobId) {
      if (!mongoose.isValidObjectId(jobId)) return careerJson({ error: "invalid_id" }, 400);
      filter.jobId = jobId;
    }
    const apps = await getCareerApplicationModel().find(filter).sort({ appliedAt: -1 }).limit(500).lean();
    const jobs = await getCareerJobModel().find({ _id: { $in: apps.map((a) => a.jobId) } }).lean();
    const byId = new Map(jobs.map((j) => [String(j._id), j]));
    const items = apps
      .filter((a) => byId.has(String(a.jobId)))
      .map((a) => ({ ...serializeJob(byId.get(String(a.jobId))), application: serializeApp(a) }));
    return careerJson({ items });
  } catch (err) {
    console.error("[career-applications] GET error:", err);
    return careerJson({ error: "internal_error" }, 500);
  }
}

export async function POST(request) {
  const { user, response } = await requireCareer();
  if (response) return response;
  try {
    const rl = await enforceRateLimit(request, {
      keyPrefix: "career:apply",
      limit: 20,
      windowSeconds: 60,
      extraKey: `user:${user.id}`,
    });
    if (rl) return rl;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || !mongoose.isValidObjectId(body.jobId)) {
      return careerJson({ error: "invalid_id" }, 400);
    }
    const proposedDate = typeof body.proposedDate === "string" ? body.proposedDate.trim() : "";
    if (proposedDate && (!DATE_RE.test(proposedDate) || Number.isNaN(Date.parse(proposedDate)))) {
      return careerJson({ error: "invalid_date" }, 400);
    }
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (note.length > NOTE_MAX) return careerJson({ error: "note_too_long" }, 400);

    await connectToMongo();
    const job = await getCareerJobModel().findById(body.jobId, "status").lean();
    if (!job) return careerJson({ error: "not_found" }, 404);
    if (job.status !== "open") return careerJson({ error: "job_closed" }, 409);

    const accountId = new mongoose.Types.ObjectId(user.id);
    const assigned = await getCareerAssignmentModel().exists({ jobId: job._id, accountId, status: { $ne: "cancelled" } });
    if (assigned) return careerJson({ error: "already_assigned" }, 409);

    const Application = getCareerApplicationModel();
    const existing = await Application.findOne({ jobId: job._id, accountId });
    if (existing) {
      // مسموح بإعادة التقديم بعد السحب بس.
      if (existing.status !== "withdrawn") return careerJson({ error: "already_applied" }, 409);
      Object.assign(existing, { status: "under_review", proposedDate, note, appliedAt: new Date() });
      await existing.save();
      return careerJson({ ok: true, application: serializeApp(existing) });
    }
    const created = await Application.create({ jobId: job._id, accountId, proposedDate, note });
    return careerJson({ ok: true, application: serializeApp(created) }, 201);
  } catch (err) {
    if (err?.code === 11000) return careerJson({ error: "already_applied" }, 409);
    console.error("[career-applications] POST error:", err);
    return careerJson({ error: "internal_error" }, 500);
  }
}

export async function PATCH(request) {
  const { user, response } = await requireCareer();
  if (response) return response;
  try {
    const body = await request.json().catch(() => null);
    if (!body || !mongoose.isValidObjectId(body.jobId)) return careerJson({ error: "invalid_id" }, 400);
    await connectToMongo();
    const res = await getCareerApplicationModel().findOneAndUpdate(
      { jobId: body.jobId, accountId: user.id, status: "under_review" },
      { $set: { status: "withdrawn" } },
      { new: true }
    );
    if (!res) return careerJson({ error: "not_found" }, 404);
    return careerJson({ ok: true });
  } catch (err) {
    console.error("[career-applications] PATCH error:", err);
    return careerJson({ error: "internal_error" }, 500);
  }
}
