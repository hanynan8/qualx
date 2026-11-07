// app/api/career/jobs/route.js — لوحة الوظائف (Job Board) لحساب الكارير.
// ?type=onsite (الافتراضي) | web_phone. بيرجّع الوظائف المفتوحة + عدّادات.
import { connectToMongo } from "../../../lib/mongodb";
import { requireCareer, careerJson } from "../../../lib/careerAuth";
import { getCareerJobModel, serializeJob, JOB_TYPES } from "../../../lib/careerJobs";

export async function GET(request) {
  const { response } = await requireCareer();
  if (response) return response;

  try {
    const type = new URL(request.url).searchParams.get("type") || "onsite";
    if (!JOB_TYPES.includes(type)) return careerJson({ error: "invalid_type" }, 400);

    await connectToMongo();
    const Job = getCareerJobModel();
    const [docs, onsiteCount, webPhoneCount] = await Promise.all([
      Job.find({ status: "open", type }).sort({ createdAt: -1 }).limit(500).lean(),
      Job.countDocuments({ status: "open", type: "onsite" }),
      Job.countDocuments({ status: "open", type: "web_phone" }),
    ]);

    return careerJson({
      items: docs.map(serializeJob),
      counts: { onsite: onsiteCount, webPhone: webPhoneCount },
    });
  } catch (err) {
    console.error("[career-jobs] error:", err);
    return careerJson({ error: "internal_error" }, 500);
  }
}
