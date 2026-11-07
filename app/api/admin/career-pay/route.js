// app/api/admin/career-pay/route.js — مستحقات الكارير (admin-only).
//   GET  ?month=YYYY-MM → كل البنود في الشهر
//   POST { email, jobTitle, compensation, reimbursement?, currency?, month, status?, jobId?, note? } → إضافة بند
import mongoose from "mongoose";
import { connectToMongo } from "../../../lib/mongodb";
import { logAudit } from "../../../lib/auditLog";
import { adminGuard, adminJson as json } from "../../../lib/careerAdmin";
import { getCareerAccountModel } from "../../../lib/careerAuth";
import { getPayModel, serializePay, PAY_STATUSES, MONTH_RE } from "../../../lib/careerExtras";

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 10_000_000 ? n : null;
};

export async function GET(request) {
  try {
    const g = await adminGuard(request, "admin:career-pay:list");
    if (g.response) return g.response;
    const month = new URL(request.url).searchParams.get("month");
    if (!month || !MONTH_RE.test(month)) return json({ error: "invalid_month" }, 400);
    await connectToMongo();
    const docs = await getPayModel().find({ month }).sort({ createdAt: -1 }).limit(5000).lean();
    const accounts = await getCareerAccountModel()
      .find({ _id: { $in: docs.map((d) => d.accountId) } }, "name email")
      .lean();
    const byId = new Map(accounts.map((a) => [String(a._id), a]));
    return json({
      items: docs.map((d) => ({
        ...serializePay(d),
        name: byId.get(String(d.accountId))?.name || "",
        email: byId.get(String(d.accountId))?.email || "",
      })),
    });
  } catch (err) {
    console.error("[admin/career-pay] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function POST(request) {
  try {
    const g = await adminGuard(request, "admin:career-pay:create", 120);
    if (g.response) return g.response;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "invalid_body" }, 400);

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
    const compensation = num(body.compensation);
    const reimbursement = body.reimbursement === undefined ? 0 : num(body.reimbursement);
    const currency = typeof body.currency === "string" && /^[A-Za-z]{3}$/.test(body.currency.trim()) ? body.currency.trim().toUpperCase() : "EGP";
    const status = body.status === undefined ? "pending_review" : body.status;
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";

    if (!email || email.length > 254) return json({ error: "invalid_email" }, 400);
    if (!jobTitle || jobTitle.length > 200) return json({ error: "invalid_title" }, 400);
    if (compensation === null || reimbursement === null) return json({ error: "invalid_amount" }, 400);
    if (typeof body.month !== "string" || !MONTH_RE.test(body.month)) return json({ error: "invalid_month" }, 400);
    if (!PAY_STATUSES.includes(status)) return json({ error: "invalid_status" }, 400);
    if (body.jobId && !mongoose.isValidObjectId(body.jobId)) return json({ error: "invalid_id" }, 400);

    await connectToMongo();
    const account = await getCareerAccountModel().findOne({ email }, "_id email").lean();
    if (!account) return json({ error: "account_not_found" }, 404);

    const doc = await getPayModel().create({
      accountId: account._id,
      jobId: body.jobId || null,
      jobTitle,
      compensation,
      reimbursement,
      currency,
      month: body.month,
      status,
      note,
    });
    await logAudit({
      request,
      actor: g.session.user,
      action: "career.pay_created",
      targetId: String(doc._id),
      targetEmail: account.email,
      details: { month: body.month, status },
    });
    return json({ ok: true, id: String(doc._id) }, 201);
  } catch (err) {
    console.error("[admin/career-pay] POST error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
