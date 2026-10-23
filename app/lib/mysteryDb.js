// app/lib/mysteryDb.js
//
// موديلات الميستري شوبنج (فروع / زيارات / إجراءات / إعدادات) + هيلبرز مشتركة
// لراوتات /api/mystery/*.
//
// 🔒 كل مستند بيتخزن بـ owner = id المستخدم، وكل استعلام لازم يفلتر بيه — يعني
// كل مستخدم بيشوف بياناته بس. الصلاحية نفسها (مين يدخل الداشبورد) من
// dashboardAccess.js، والفحص صارم عن طريق requireSession (getServerSession).

import mongoose from "mongoose";
import { connectToMongo, getAuthModel } from "./mongodb";
import { requireSession } from "./rbac";
import { enforceRateLimit } from "./rateLimit";
import { canAccessMysteryDashboard } from "./dashboardAccess";
import { toDay, visitRating, DEFAULT_SETTINGS } from "./mysteryShopping";

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

const visitSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true },
    branchId: { type: String, required: true },
    date: { type: Date, required: true },
    evaluator: { type: String, default: "" },
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "completed" },
    scores: {
      type: new mongoose.Schema(
        { service: Number, cleanliness: Number, speed: Number, staff: Number },
        { _id: false }
      ),
      default: null,
    },
    rating: { type: Number, default: null },
    notes: { type: String, default: "" },
  },
  opts
);
visitSchema.index({ owner: 1, date: -1 });
visitSchema.index({ owner: 1, branchId: 1 });

const actionSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["open", "in_progress", "done"], default: "open" },
    dueDate: { type: Date, default: null },
    branchId: { type: String, default: null },
  },
  opts
);
actionSchema.index({ owner: 1, status: 1 });

const settingsSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, unique: true },
    orgName: { type: String, default: DEFAULT_SETTINGS.orgName },
    targetScore: { type: Number, default: DEFAULT_SETTINGS.targetScore },
    excellentFrom: { type: Number, default: DEFAULT_SETTINGS.excellentFrom },
    goodFrom: { type: Number, default: DEFAULT_SETTINGS.goodFrom },
  },
  opts
);

const model = (name, schema, collection) => mongoose.models[name] || mongoose.model(name, schema, collection);

export const MsBranch = () => model("MsBranch", branchSchema, "ms_branches");
export const MsVisit = () => model("MsVisit", visitSchema, "ms_visits");
export const MsAction = () => model("MsAction", actionSchema, "ms_actions");
export const MsSettings = () => model("MsSettings", settingsSchema, "ms_settings");

// ───────────────────────── helpers ─────────────────────────
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const isId = (v) => typeof v === "string" && mongoose.Types.ObjectId.isValid(v) && String(new mongoose.Types.ObjectId(v)) === v;

export async function readJson(request, maxBytes = 64 * 1024) {
  try {
    const raw = await request.text();
    if (!raw || raw.length > maxBytes) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// بيرجّع { userId } أو { response } (401/403/429). write=true بيضيف rate limit.
export async function mysteryAuth(request, { write = false } = {}) {
  const base = await requireSession();
  if (base.response) return { response: base.response };
  const user = base.session.user;
  if (!canAccessMysteryDashboard(user)) return { response: json({ error: "forbidden" }, 403) };
  let userId = String(user.id);

  // 👤 الأدمن بس يقدر يشتغل على بيانات عميل: ?as=<id العميل>. أي حد تاني بيبعت
  // `as` بياخد 403 (مفيش طريقة يشوف بيها بيانات غيره). كل البيانات فضلت
  // متفلترة بـ owner، فالأدمن بيدخّل زيارات العميل ويظهرله في داشبورده.
  const as = new URL(request.url).searchParams.get("as");
  if (as) {
    if (user.role !== "admin") return { response: json({ error: "forbidden" }, 403) };
    if (!isId(as)) return { response: json({ error: "invalid_id" }, 400) };
    userId = as;
  }

  if (write) {
    const rl = await enforceRateLimit(request, {
      keyPrefix: "mystery:write",
      limit: 120,
      windowSeconds: 60,
      extraKey: `user:${userId}`,
    });
    if (rl) return { response: rl };
  }
  await connectToMongo();
  if (as && !(await getAuthModel().exists({ _id: as }))) return { response: json({ error: "client_not_found" }, 404) };
  return { userId, user };
}

export function serializeBranch(b) {
  return { id: String(b._id), name: b.name, city: b.city || "", status: b.status };
}

export function serializeVisit(v) {
  return {
    id: String(v._id),
    branchId: v.branchId,
    date: toDay(v.date),
    evaluator: v.evaluator || "",
    status: v.status,
    scores: v.scores ? { service: v.scores.service, cleanliness: v.scores.cleanliness, speed: v.scores.speed, staff: v.scores.staff } : null,
    rating: v.rating ?? visitRating(v.scores),
    notes: v.notes || "",
  };
}

export function serializeAction(a) {
  return {
    id: String(a._id),
    title: a.title,
    description: a.description || "",
    priority: a.priority,
    status: a.status,
    dueDate: a.dueDate ? toDay(a.dueDate) : null,
    branchId: a.branchId || null,
  };
}

export async function loadSettings(owner) {
  const doc = await MsSettings().findOne({ owner }).lean();
  return {
    orgName: doc?.orgName ?? DEFAULT_SETTINGS.orgName,
    targetScore: doc?.targetScore ?? DEFAULT_SETTINGS.targetScore,
    excellentFrom: doc?.excellentFrom ?? DEFAULT_SETTINGS.excellentFrom,
    goodFrom: doc?.goodFrom ?? DEFAULT_SETTINGS.goodFrom,
  };
}

// كل زيارات المستخدم كـ plain objects جاهزة لدوال الحساب.
export async function loadVisits(owner, filter = {}) {
  const docs = await MsVisit().find({ owner, ...filter }).limit(20000).lean();
  return docs.map(serializeVisit);
}

export async function loadBranches(owner) {
  return MsBranch().find({ owner }).sort({ name: 1 }).limit(500).lean();
}