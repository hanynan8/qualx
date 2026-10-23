// app/lib/auditDb.js
//
// موديلات داشبورد زيارات التدقيق (فروع / زيارات / ملاحظات / إعدادات) + هيلبرز راوتات /api/audit/*.
//
// 🔒 كل مستند بيتخزن بـ owner = id المستخدم وكل استعلام بيفلتر بيه (نفس نموذج الميستري شوبنج).
// 🔁 كل بند "غير مطابق" في زيارة مكتملة بيتحوّل تلقائيًا لملاحظة (Finding) — syncVisitFindings.

import mongoose from "mongoose";
import { connectToMongo, getAuthModel } from "./mongodb";
import { requireSession } from "./rbac";
import { enforceRateLimit } from "./rateLimit";
import { canAccessAuditDashboard } from "./dashboardAccess";
import { json, isId, readJson } from "./mysteryDb";
import { toDay, addDays, countResults, DEFAULT_SETTINGS } from "./auditing";

export { json, isId, readJson };

const opts = { timestamps: true };

const branchSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, index: true },
    name: { type: String, required: true },
    city: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  opts
);

const resultSchema = new mongoose.Schema(
  {
    area: { type: String, required: true },
    item: { type: String, required: true },
    result: { type: String, enum: ["pass", "fail", "na"], required: true },
    severity: { type: String, enum: ["critical", "major", "minor"] },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const visitSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true },
    branchId: { type: String, required: true },
    date: { type: Date, required: true },
    auditor: { type: String, default: "" },
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "completed" },
    results: { type: [resultSchema], default: [] },
    compliance: { type: Number, default: null },
    notes: { type: String, default: "" },
  },
  opts
);
visitSchema.index({ owner: 1, date: -1 });
visitSchema.index({ owner: 1, branchId: 1 });

const findingSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true },
    branchId: { type: String, default: null },
    visitId: { type: String, default: null }, // null = ملاحظة يدوية
    key: { type: String, default: "" }, // area|item — بيربط الملاحظة ببند الزيارة
    title: { type: String, required: true },
    area: { type: String, required: true },
    severity: { type: String, enum: ["critical", "major", "minor"], default: "major" },
    status: { type: String, enum: ["open", "in_progress", "closed"], default: "open" },
    note: { type: String, default: "" },
    assignee: { type: String, default: "" },
    resolution: { type: String, default: "" },
    openedAt: { type: Date, required: true },
    dueDate: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  opts
);
findingSchema.index({ owner: 1, status: 1 });
findingSchema.index({ owner: 1, visitId: 1, key: 1 });

const settingsSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, unique: true },
    orgName: { type: String, default: DEFAULT_SETTINGS.orgName },
    targetCompliance: { type: Number, default: DEFAULT_SETTINGS.targetCompliance },
    compliantFrom: { type: Number, default: DEFAULT_SETTINGS.compliantFrom },
    partialFrom: { type: Number, default: DEFAULT_SETTINGS.partialFrom },
    sla: {
      type: new mongoose.Schema({ critical: Number, major: Number, minor: Number }, { _id: false }),
      default: () => ({ ...DEFAULT_SETTINGS.sla }),
    },
    checklist: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  opts
);

const model = (name, schema, collection) => mongoose.models[name] || mongoose.model(name, schema, collection);

export const AuBranch = () => model("AuBranch", branchSchema, "au_branches");
export const AuVisit = () => model("AuVisit", visitSchema, "au_visits");
export const AuFinding = () => model("AuFinding", findingSchema, "au_findings");
export const AuSettings = () => model("AuSettings", settingsSchema, "au_settings");

// ───────────────────────── auth ─────────────────────────
// بيرجّع { userId, user } أو { response } (401/403/429/404). write=true بيضيف rate limit.
export async function auditAuth(request, { write = false } = {}) {
  const base = await requireSession();
  if (base.response) return { response: base.response };
  const user = base.session.user;
  if (!canAccessAuditDashboard(user)) return { response: json({ error: "forbidden" }, 403) };
  let userId = String(user.id);

  // 👤 الأدمن بس يقدر يشتغل على بيانات عميل (?as=<id>). أي حد تاني بياخد 403.
  const as = new URL(request.url).searchParams.get("as");
  if (as) {
    if (user.role !== "admin") return { response: json({ error: "forbidden" }, 403) };
    if (!isId(as)) return { response: json({ error: "invalid_id" }, 400) };
    userId = as;
  }

  if (write) {
    const rl = await enforceRateLimit(request, { keyPrefix: "audit:write", limit: 120, windowSeconds: 60, extraKey: `user:${userId}` });
    if (rl) return { response: rl };
  }
  await connectToMongo();
  if (as && !(await getAuthModel().exists({ _id: as }))) return { response: json({ error: "client_not_found" }, 404) };
  return { userId, user };
}

// ───────────────────────── serializers ─────────────────────────
export function serializeBranch(b) {
  return { id: String(b._id), name: b.name, city: b.city || "", status: b.status };
}

export function serializeVisit(v) {
  const results = (v.results || []).map((r) => ({
    area: r.area,
    item: r.item,
    result: r.result,
    ...(r.result === "fail" ? { severity: r.severity || "major", note: r.note || "" } : {}),
  }));
  return {
    id: String(v._id),
    branchId: v.branchId,
    date: toDay(v.date),
    auditor: v.auditor || "",
    status: v.status,
    compliance: v.compliance ?? null,
    counts: countResults(results),
    results,
    notes: v.notes || "",
  };
}

export function serializeFinding(f) {
  return {
    id: String(f._id),
    branchId: f.branchId || null,
    visitId: f.visitId || null,
    source: f.visitId ? "audit" : "manual",
    title: f.title,
    area: f.area,
    severity: f.severity,
    status: f.status,
    note: f.note || "",
    assignee: f.assignee || "",
    resolution: f.resolution || "",
    openedAt: toDay(f.openedAt),
    dueDate: f.dueDate ? toDay(f.dueDate) : null,
    closedAt: f.closedAt ? toDay(f.closedAt) : null,
  };
}

// ───────────────────────── loaders ─────────────────────────
export async function loadSettings(owner) {
  const d = await AuSettings().findOne({ owner }).lean();
  return {
    orgName: d?.orgName ?? DEFAULT_SETTINGS.orgName,
    targetCompliance: d?.targetCompliance ?? DEFAULT_SETTINGS.targetCompliance,
    compliantFrom: d?.compliantFrom ?? DEFAULT_SETTINGS.compliantFrom,
    partialFrom: d?.partialFrom ?? DEFAULT_SETTINGS.partialFrom,
    sla: { ...DEFAULT_SETTINGS.sla, ...(d?.sla || {}) },
    checklist: d?.checklist ?? null,
  };
}

export async function loadVisits(owner, filter = {}) {
  const docs = await AuVisit().find({ owner, ...filter }).limit(20000).lean();
  return docs.map(serializeVisit);
}

export async function loadFindings(owner, filter = {}) {
  const docs = await AuFinding().find({ owner, ...filter }).limit(20000).lean();
  return docs.map(serializeFinding);
}

export async function loadBranches(owner) {
  return AuBranch().find({ owner }).sort({ name: 1 }).limit(500).lean();
}

// ───────────────────────── findings sync ─────────────────────────
// بعد حفظ زيارة: كل بند غير مطابق → ملاحظة (بتتحدّث لو موجودة، وبتتمسح لو البند بقى مطابق
// أو الزيارة مبقتش مكتملة). حالة الملاحظة/المسؤول/الحل بيفضلوا زي ما هما.
export async function syncVisitFindings(owner, visit, settings) {
  const visitId = String(visit._id);
  const fails = visit.status === "completed" ? (visit.results || []).filter((r) => r.result === "fail") : [];
  const wanted = new Map(fails.map((r) => [`${r.area}|${r.item}`, r]));
  const Finding = AuFinding();
  const existing = await Finding.find({ owner, visitId });
  const day = toDay(visit.date);

  const stale = existing.filter((f) => !wanted.has(f.key)).map((f) => f._id);
  if (stale.length) await Finding.deleteMany({ owner, _id: { $in: stale } });

  const byKey = new Map(existing.filter((f) => wanted.has(f.key)).map((f) => [f.key, f]));
  const creates = [];
  for (const [key, r] of wanted) {
    const severity = r.severity || "major";
    const f = byKey.get(key);
    if (f) {
      const changedSeverity = f.severity !== severity;
      f.severity = severity;
      f.note = r.note || "";
      f.title = r.item;
      f.area = r.area;
      f.branchId = visit.branchId;
      f.openedAt = visit.date;
      if (changedSeverity && f.status !== "closed") f.dueDate = new Date(`${addDays(day, settings.sla[severity])}T00:00:00.000Z`);
      await f.save();
    } else {
      creates.push({
        owner,
        branchId: visit.branchId,
        visitId,
        key,
        title: r.item,
        area: r.area,
        severity,
        note: r.note || "",
        openedAt: visit.date,
        dueDate: new Date(`${addDays(day, settings.sla[severity])}T00:00:00.000Z`),
      });
    }
  }
  if (creates.length) await Finding.insertMany(creates);
}
