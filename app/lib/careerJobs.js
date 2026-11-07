// app/lib/careerJobs.js
//
// موديلات وظائف بوابة الكارير:
//   - career_jobs: الوظائف/المهام (بينشرها الأدمن).
//   - career_assignments: ربط وظيفة بحساب كارير اتقبل فيها = بتظهر في "My Jobs".
// + تنضيف/فحص مدخلات الأدمن (مشترك بين راوتات الإنشاء والتعديل).

import mongoose from "mongoose";

export const JOB_TYPES = ["onsite", "web_phone"];
export const JOB_STATUSES = ["open", "closed"];
export const ASSIGNMENT_STATUSES = ["assigned", "in_progress", "submitted", "completed", "cancelled"];
export const APPLICATION_STATUSES = ["under_review", "accepted", "rejected", "withdrawn"];
// الحالات اللي لسه "شغالة" (بتتحسب في عدّاد My Jobs).
export const ACTIVE_ASSIGNMENT_STATUSES = ["assigned", "in_progress", "submitted"];

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    client: { type: String, default: "", trim: true },
    logoUrl: { type: String, default: "" },
    city: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    // إحداثيات اختيارية: لو موجودة بنحسب المسافة من مكان المستخدم.
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    type: { type: String, enum: JOB_TYPES, default: "onsite" },
    compensation: { type: String, default: "", trim: true },
    reimbursement: { type: String, default: "", trim: true },
    firstDate: { type: String, default: "" }, // YYYY-MM-DD
    lastDate: { type: String, default: "" }, // YYYY-MM-DD
    description: { type: String, default: "" },
    status: { type: String, enum: JOB_STATUSES, default: "open" },
  },
  { timestamps: true }
);
jobSchema.index({ status: 1, type: 1, createdAt: -1 });

const assignmentSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    status: { type: String, enum: ASSIGNMENT_STATUSES, default: "assigned" },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
assignmentSchema.index({ jobId: 1, accountId: 1 }, { unique: true });

// طلبات التقديم: الفريلانسر بيقدّم على وظيفة (My Applications). قبول الأدمن = تكليف في career_assignments.
const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: "under_review" },
    proposedDate: { type: String, default: "" }, // YYYY-MM-DD — التاريخ اللي بيقترحه المتقدّم
    note: { type: String, default: "", trim: true },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
applicationSchema.index({ jobId: 1, accountId: 1 }, { unique: true });

export function getCareerApplicationModel() {
  return (
    mongoose.models.Model_career_application ||
    mongoose.model("Model_career_application", applicationSchema, "career_applications")
  );
}

export function getCareerJobModel() {
  return mongoose.models.Model_career_job || mongoose.model("Model_career_job", jobSchema, "career_jobs");
}
export function getCareerAssignmentModel() {
  return (
    mongoose.models.Model_career_assignment ||
    mongoose.model("Model_career_assignment", assignmentSchema, "career_assignments")
  );
}

// الشكل اللي بيوصل للمتصفح (من غير أي حقول داخلية).
export function serializeJob(j) {
  return {
    id: String(j._id),
    title: j.title,
    client: j.client || "",
    logoUrl: j.logoUrl || "",
    city: j.city || "",
    address: j.address || "",
    lat: typeof j.lat === "number" ? j.lat : null,
    lng: typeof j.lng === "number" ? j.lng : null,
    type: j.type,
    compensation: j.compensation || "",
    reimbursement: j.reimbursement || "",
    firstDate: j.firstDate || "",
    lastDate: j.lastDate || "",
    description: j.description || "",
    status: j.status,
  };
}

const LIMITS = {
  title: 200,
  client: 120,
  logoUrl: 500,
  city: 120,
  address: 300,
  compensation: 80,
  reimbursement: 80,
  description: 8000,
};
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * بيفحص ويتنضف مدخلات وظيفة من الأدمن. الحقول بتتنسخ واحد واحد (مفيش spread
 * للـ body = مفيش mass-assignment). partial=true للتعديل (الحقول الغايبة بتتساب).
 * @returns {{data?:object, error?:string}}
 */
export function cleanJobInput(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "invalid_body" };
  const data = {};

  for (const f of ["title", "client", "city", "address", "compensation", "reimbursement", "description"]) {
    if (body[f] === undefined) continue;
    if (typeof body[f] !== "string") return { error: "invalid_body" };
    const v = body[f].trim();
    if (v.length > LIMITS[f]) return { error: `${f}_too_long` };
    data[f] = v;
  }

  if (body.logoUrl !== undefined) {
    if (typeof body.logoUrl !== "string") return { error: "invalid_body" };
    const v = body.logoUrl.trim();
    if (v && (!/^https:\/\//i.test(v) || v.length > LIMITS.logoUrl)) return { error: "invalid_logo_url" };
    data.logoUrl = v;
  }

  for (const f of ["firstDate", "lastDate"]) {
    if (body[f] === undefined) continue;
    if (typeof body[f] !== "string") return { error: "invalid_body" };
    const v = body[f].trim();
    if (v && (!DATE_RE.test(v) || Number.isNaN(Date.parse(v)))) return { error: `invalid_${f}` };
    data[f] = v;
  }

  for (const [f, min, max] of [["lat", -90, 90], ["lng", -180, 180]]) {
    if (body[f] === undefined) continue;
    if (body[f] === null || body[f] === "") {
      data[f] = null;
      continue;
    }
    const n = Number(body[f]);
    if (!Number.isFinite(n) || n < min || n > max) return { error: `invalid_${f}` };
    data[f] = n;
  }

  if (body.type !== undefined) {
    if (!JOB_TYPES.includes(body.type)) return { error: "invalid_type" };
    data.type = body.type;
  }
  if (body.status !== undefined) {
    if (!JOB_STATUSES.includes(body.status)) return { error: "invalid_status" };
    data.status = body.status;
  }

  if (!partial && !data.title) return { error: "missing_title" };
  if (partial && data.title === "") return { error: "missing_title" };
  if (data.firstDate && data.lastDate && data.firstDate > data.lastDate) return { error: "invalid_date_range" };

  return { data };
}
