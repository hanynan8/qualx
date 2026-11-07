// app/api/career/certifications/route.js — التدريب والاعتمادات (Training & Certifications).
//   GET  → كل الشهادات النشطة + تقدّم الحساب الحالي في كل واحدة
//   POST { certId } → بدء شهادة (بتبقى in_progress). الإكمال بيعتمده الأدمن.
import mongoose from "mongoose";
import { connectToMongo } from "../../../lib/mongodb";
import { requireCareer, careerJson } from "../../../lib/careerAuth";
import { enforceRateLimit } from "../../../lib/rateLimit";
import { getCertModel, getCertProgressModel, serializeCert } from "../../../lib/careerExtras";

export async function GET() {
  const { user, response } = await requireCareer();
  if (response) return response;
  try {
    await connectToMongo();
    const [certs, progress] = await Promise.all([
      getCertModel().find({ status: "active" }).sort({ createdAt: -1 }).limit(200).lean(),
      getCertProgressModel().find({ accountId: user.id }).lean(),
    ]);
    const byCert = new Map(progress.map((p) => [String(p.certId), p]));
    return careerJson({
      items: certs.map((c) => {
        const p = byCert.get(String(c._id));
        return {
          ...serializeCert(c),
          progress: p ? { status: p.status, startedAt: p.startedAt, completedAt: p.completedAt } : null,
        };
      }),
    });
  } catch (err) {
    console.error("[career-certs] GET error:", err);
    return careerJson({ error: "internal_error" }, 500);
  }
}

export async function POST(request) {
  const { user, response } = await requireCareer();
  if (response) return response;
  try {
    const rl = await enforceRateLimit(request, {
      keyPrefix: "career:cert-start",
      limit: 30,
      windowSeconds: 60,
      extraKey: `user:${user.id}`,
    });
    if (rl) return rl;
    const body = await request.json().catch(() => null);
    if (!mongoose.isValidObjectId(body?.certId)) return careerJson({ error: "invalid_id" }, 400);
    await connectToMongo();
    const cert = await getCertModel().findOne({ _id: body.certId, status: "active" }, "_id").lean();
    if (!cert) return careerJson({ error: "not_found" }, 404);
    // upsert: لو بدأها قبل كده أو خلّصها مابنغيرش حاجة.
    await getCertProgressModel().updateOne(
      { certId: cert._id, accountId: user.id },
      { $setOnInsert: { status: "in_progress", startedAt: new Date() } },
      { upsert: true }
    );
    return careerJson({ ok: true });
  } catch (err) {
    console.error("[career-certs] POST error:", err);
    return careerJson({ error: "internal_error" }, 500);
  }
}
