// app/lib/careerExtras.js — موديلات تاب Certifications (التدريب والاعتماد) وتاب My Pay (المستحقات).
import mongoose from "mongoose";

/* ───────── Certifications ───────── */
export const CERT_PROGRESS_STATUSES = ["in_progress", "completed"];

const certSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    materialsUrl: { type: String, default: "" }, // https فقط
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

const certProgressSchema = new mongoose.Schema(
  {
    certId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    status: { type: String, enum: CERT_PROGRESS_STATUSES, default: "in_progress" },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
certProgressSchema.index({ certId: 1, accountId: 1 }, { unique: true });

export const getCertModel = () =>
  mongoose.models.Model_career_cert || mongoose.model("Model_career_cert", certSchema, "career_certifications");
export const getCertProgressModel = () =>
  mongoose.models.Model_career_cert_progress ||
  mongoose.model("Model_career_cert_progress", certProgressSchema, "career_cert_progress");

export const serializeCert = (c) => ({
  id: String(c._id),
  title: c.title,
  description: c.description || "",
  materialsUrl: c.materialsUrl || "",
});

/* ───────── Pay ───────── */
export const PAY_STATUSES = ["pending_review", "pay_approved", "rejected"];
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const paySchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, default: null },
    jobTitle: { type: String, required: true, trim: true },
    compensation: { type: Number, default: 0, min: 0 },
    reimbursement: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "EGP", trim: true, uppercase: true },
    month: { type: String, required: true }, // YYYY-MM = شهر تنفيذ المهمة
    status: { type: String, enum: PAY_STATUSES, default: "pending_review" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);
paySchema.index({ accountId: 1, month: 1 });

export const getPayModel = () =>
  mongoose.models.Model_career_pay || mongoose.model("Model_career_pay", paySchema, "career_pay_items");

export const serializePay = (p) => ({
  id: String(p._id),
  jobTitle: p.jobTitle,
  compensation: p.compensation || 0,
  reimbursement: p.reimbursement || 0,
  total: (p.compensation || 0) + (p.reimbursement || 0),
  currency: p.currency || "EGP",
  month: p.month,
  status: p.status,
  note: p.note || "",
});

/** تنضيف/فحص مدخلات الشهادة من الأدمن (partial=true للتعديل). */
export function cleanCert(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "invalid_body" };
  const data = {};
  for (const [f, max] of [["title", 200], ["description", 8000], ["materialsUrl", 500]]) {
    if (body[f] === undefined) continue;
    if (typeof body[f] !== "string") return { error: "invalid_body" };
    const v = body[f].trim();
    if (v.length > max) return { error: `${f}_too_long` };
    if (f === "materialsUrl" && v && !/^https:\/\//i.test(v)) return { error: "invalid_materials_url" };
    data[f] = v;
  }
  if (body.status !== undefined) {
    if (!["active", "archived"].includes(body.status)) return { error: "invalid_status" };
    data.status = body.status;
  }
  if (!partial && !data.title) return { error: "missing_title" };
  if (partial && data.title === "") return { error: "missing_title" };
  return { data };
}

