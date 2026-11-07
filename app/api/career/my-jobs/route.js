// app/api/career/my-jobs/route.js — الوظائف/المهام اللي اتقبل فيها حساب الكارير (My Jobs).
// بيرجّع تكليفات الحساب الحالي بس (accountId من الجلسة، مش من أي مدخل).
import mongoose from "mongoose";
import { connectToMongo } from "../../../lib/mongodb";
import { requireCareer, careerJson } from "../../../lib/careerAuth";
import { getCareerJobModel, getCareerAssignmentModel, serializeJob } from "../../../lib/careerJobs";

export async function GET() {
  const { user, response } = await requireCareer();
  if (response) return response;

  try {
    await connectToMongo();
    const assignments = await getCareerAssignmentModel()
      .find({ accountId: new mongoose.Types.ObjectId(user.id), status: { $ne: "cancelled" } })
      .sort({ assignedAt: -1 })
      .limit(500)
      .lean();

    const jobs = await getCareerJobModel()
      .find({ _id: { $in: assignments.map((a) => a.jobId) } })
      .lean();
    const byId = new Map(jobs.map((j) => [String(j._id), j]));

    const items = assignments
      .filter((a) => byId.has(String(a.jobId)))
      .map((a) => ({
        ...serializeJob(byId.get(String(a.jobId))),
        assignment: { status: a.status, assignedAt: a.assignedAt },
      }));

    return careerJson({ items });
  } catch (err) {
    console.error("[career-my-jobs] error:", err);
    return careerJson({ error: "internal_error" }, 500);
  }
}
