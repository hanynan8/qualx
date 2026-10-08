// app/lib/contentGuard.js
//
// أدوات مشتركة لراوت لوحة الأدمن (app/api/admin/content): التحقق من اسم
// الكولكشن، تعقيم الـ payload (منع NoSQL injection / prototype pollution /
// JSON bomb)، والحصول على موديل ديناميكي لأي كولكشن.
//
// ⚠️ نفس القواعد الموجودة في app/api/data/route.js بالظبط (نفس الـ regex
// ونفس الكولكشنز المحمية) عشان الاتنين يفضلوا متسقين. الفرق: الراوت ده
// admin-only بالكامل (قراءة وكتابة)، فمفيش allowlist للقراءة العامة هنا.

import mongoose from "mongoose";

export const COLLECTION_NAME_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

// كولكشنز ممنوعة تمامًا حتى على الأدمن من الراوت ده: الحسابات (فيها باسوردات
// وأسرار MFA) وسجل التدقيق (append-only).
export const PROTECTED_COLLECTIONS = new Set(["auth", "audit_logs"]);

export function isValidCollectionName(name) {
  return typeof name === "string" && COLLECTION_NAME_REGEX.test(name);
}

export function isProtectedCollection(name) {
  return PROTECTED_COLLECTIONS.has(String(name));
}

// ───────────────────────── sanitize ─────────────────────────
const DANGEROUS_KEY_PATTERN = /^\$|\.|^__proto__$|^constructor$|^prototype$/;
const MAX_NESTING_DEPTH = 20;

export function sanitizeObject(obj, depth = 0) {
  if (obj === null || typeof obj !== "object") return obj;
  if (depth > MAX_NESTING_DEPTH) throw new Error("Object nesting too deep");

  if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item, depth + 1));

  const clean = {};
  for (const key of Object.keys(obj)) {
    if (DANGEROUS_KEY_PATTERN.test(key)) throw new Error(`Invalid field name: ${key}`);
    clean[key] = sanitizeObject(obj[key], depth + 1);
  }
  return clean;
}

// حقول بيديرها السيرفر نفسه — أي قيمة جاية من العميل ليها بتتشال.
export const SERVER_MANAGED_FIELDS = ["_id", "__v", "createdAt", "updatedAt"];

export function stripServerFields(obj) {
  const copy = { ...obj };
  for (const f of SERVER_MANAGED_FIELDS) delete copy[f];
  return copy;
}

// ───────────────────────── models ─────────────────────────
if (!globalThis._mongoModels) globalThis._mongoModels = {};

const looseSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

// ⚠️ لازم نفس اسم الموديل (Model_<name>) اللي بيستخدمه app/api/data/route.js،
// وإلا mongoose هيرمي OverwriteModelError لو الاتنين سجّلوا نفس الكولكشن.
export function getModelForCollection(collectionName) {
  const name = String(collectionName);
  if (globalThis._mongoModels[name]) return globalThis._mongoModels[name];

  const modelName = `Model_${name.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const Model = mongoose.models[modelName] || mongoose.model(modelName, looseSchema, name);
  globalThis._mongoModels[name] = Model;
  return Model;
}

export async function listCollectionNames() {
  const cols = await mongoose.connection.db.listCollections().toArray();
  return cols.map((c) => c.name).filter((n) => !n.startsWith("system."));
}
