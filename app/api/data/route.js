// app/api/data/route.js
//
// ==========================================================================
// نسخة مؤمّنة (Hardened) — كل التعديلات موضّحة بتعليقات تبدأ بـ "🔒 SECURITY:"
//
// 🔄 ملحوظة: النسخة اللي كانت جوه الملف المرفوع (zip) كانت نسخة قديمة جدًا
// وغير مؤمنة خالص (GET بدون collection كان بيرجع *كل* حاجة في الداتابيز
// من غير أي تسجيل دخول). استبدلتها بالنسخة المؤمّنة اللي بعتهالي في المحادثة،
// وشلت منها بس الأجزاء الخاصة بمشروع تاني (نماذج الاستشارات/الترجمة/إشعارات
// Resend...) اللي مالهاش علاقة بـ Qualx، وسبت الجوهر: allowlist للقراءة
// العامة، admin-only للكتابة، تعقيم كامل، rate limiting، إلخ.
// ==========================================================================

import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { connectToMongo } from "@/app/lib/mongodb";

if (!globalThis._mongoModels) globalThis._mongoModels = {};

const schema = new mongoose.Schema({}, { strict: false, timestamps: true });

// 🔒 SECURITY: أسماء الكولكشنز المسموحة تتكون من حروف/أرقام/شرطة سفلية/شرطة فقط،
// وطولها محدود. ده بيمنع حد يبعت اسم كولكشن غريب يحاول يستغل سلوك mongoose/mongodb
// الغريب أو ينشئ كولكشنز عشوائية بكثرة (DoS).
const COLLECTION_NAME_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

function isValidCollectionName(name) {
  return typeof name === "string" && COLLECTION_NAME_REGEX.test(name);
}

function normalizeModelName(name) {
  return `Model_${String(name).replace(/[^a-zA-Z0-9]/g, "_")}`;
}

function getModelForCollection(collectionName) {
  const name = String(collectionName);
  if (globalThis._mongoModels[name]) return globalThis._mongoModels[name];

  const modelName = normalizeModelName(name);

  const existing = mongoose.models[modelName];
  if (existing && !existing.schema.options.timestamps) {
    delete mongoose.models[modelName];
    if (mongoose.modelSchemas) delete mongoose.modelSchemas[modelName];
  }

  const Model = mongoose.models[modelName] || mongoose.model(modelName, schema, name);
  globalThis._mongoModels[name] = Model;
  return Model;
}

async function listCollections() {
  await connectToMongo();
  const cols = await mongoose.connection.db.listCollections().toArray();
  return cols.map((c) => c.name).filter((n) => !n.startsWith("system."));
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}

// 🔒 SECURITY: حد أقصى لحجم الـ body (بالبايت) لمنع payloads ضخمة (DoS).
// PUBLIC (كتابة عامة بدون تسجيل دخول، زي "form"): 20KB كافية.
// ADMIN (باقي الكولكشنز، محتوى الموقع اللي معدّل من الأدمن): 5MB —
// كافية جدًا لمحتوى صفحة كامل بلغتين (en/ar).
const MAX_BODY_BYTES_PUBLIC = 20 * 1024;
const MAX_BODY_BYTES_ADMIN = 5 * 1024 * 1024;

async function parseBody(request, maxBytes) {
  try {
    const raw = await request.text();
    if (raw && raw.length > maxBytes) {
      throw new Error("Payload too large");
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function getSearchParams(request) {
  const url = new URL(request.url);
  return {
    collection: url.searchParams.get("collection"),
    id: url.searchParams.get("id"),
  };
}

// 🔒 SECURITY: منع NoSQL injection عبر مفاتيح خطيرة زي $where, $set...
// أو مفاتيح فيها نقطة (dot notation)، وكمان منع Prototype Pollution عبر
// __proto__ / constructor / prototype.
const DANGEROUS_KEY_PATTERN = /^\$|\.|^__proto__$|^constructor$|^prototype$/;

function isSafeKey(key) {
  return !DANGEROUS_KEY_PATTERN.test(key);
}

// 🔒 SECURITY: حد أقصى لعمق الـ objects/arrays المتداخلة (JSON bomb)، مرفوع
// بما يكفي لتغطية محتوى i18n متداخل بعمق طبيعي (home/services/careers كلها
// بها i18n.en/ar.items.<slug>.highlights[] وده بيوصل لعمق معقول من غير ما
// يبقى فيه خطر أمني حقيقي).
const MAX_NESTING_DEPTH = 20;

function sanitizeObject(obj, depth = 0) {
  if (obj === null || typeof obj !== "object") return obj;
  if (depth > MAX_NESTING_DEPTH) throw new Error("Object nesting too deep");

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  const clean = {};
  for (const key of Object.keys(obj)) {
    if (!isSafeKey(key)) {
      throw new Error(`Invalid field name: ${key}`);
    }
    clean[key] = sanitizeObject(obj[key], depth + 1);
  }
  return clean;
}

function safeSanitize(body) {
  return sanitizeObject(body);
}

// ⚠️ كولكشنز حساسة ممنوع تتعامل معها من الـ endpoint المفتوح ده خالص.
const PROTECTED_COLLECTIONS = new Set(["auth"]);

function isProtectedCollection(name) {
  return PROTECTED_COLLECTIONS.has(String(name));
}

// ✅ الكولكشنز الوحيدة المسموح فيها بالكتابة (POST) من غير تسجيل دخول admin —
// بيانات جايه من زوار الموقع نفسهم (فورم التواصل)، مش محتوى الموقع.
// كل باقي الكولكشنز (home, navbar, footer, services, careers) بتتغير من
// لوحة الأدمن بس.
const PUBLIC_WRITE_COLLECTIONS = new Set(["form"]);

// ⚠️ "form" فيها رسائل زوار الموقع (اسم/إيميل/رقم تليفون) — الكتابة عامة
// (عشان فورم التواصل يشتغل) لكن القراءة admin بس.
const ADMIN_READ_COLLECTIONS = new Set(["form"]);

function isAdminReadCollection(name) {
  return ADMIN_READ_COLLECTIONS.has(String(name));
}

// 🔒 SECURITY: allowlist صريح لأسماء الكولكشنز المسموح قراءتها عامةً من
// هنا — نفس الكولكشنز اللي صفحات الموقع فعليًا محتاجاها. أي كولكشن تاني
// لازم يتقرأ من route مخصص بيه RBAC حقيقي، مش من هنا.
const PUBLIC_READ_COLLECTIONS = new Set([
  "home",
  "navbar",
  "footer",
  "services",
  // 🆕 "careers": صفحة الوظائف بقت ديناميكية (document واحد فيه قائمة
  // الوظائف + ترجمات en/ar) بدل الـ array الثابتة اللي كانت في lib/data.jsx.
  // نفس فلسفة "services" بالظبط: قراءة عامة، كتابة admin-only.
  "careers",
  "form", // القراءة هنا لسه بتتفحص admin-only في isAdminReadCollection تحت
]);

function isPublicReadCollection(name) {
  return PUBLIC_READ_COLLECTIONS.has(String(name));
}

async function isAdminRequest() {
  const session = await getServerSession(authOptions);
  // 🔒 SECURITY: المصدر الوحيد لصلاحية الأدمن هو role المخزّن في سجل
  // المستخدم بالداتابيز (بيتحدث من لوحة الأدمن نفسها فقط).
  return session?.user?.role === "admin";
}

// 🔒 SECURITY: Rate limiting بسيط في الميموري لكل IP، بيطبق بس على POST
// العام (collection="form"). خط دفاع إضافي بس، مش بديل عن حماية edge/CDN.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
if (!globalThis._formRateLimit) globalThis._formRateLimit = new Map();

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = globalThis._formRateLimit.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    globalThis._formRateLimit.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of globalThis._formRateLimit.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 5) {
      globalThis._formRateLimit.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS * 5).unref?.();

const FORM_FIELD_MAX_LENGTHS = {
  name: 200,
  email: 254,
  phone: 40,
  service: 200,
  message: 5000,
};
const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFormPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid form data";
  }
  for (const [field, maxLen] of Object.entries(FORM_FIELD_MAX_LENGTHS)) {
    const val = body[field];
    if (val !== undefined && val !== null) {
      if (typeof val !== "string") return `Field '${field}' must be a string`;
      if (val.length > maxLen) return `Field '${field}' is too long`;
    }
  }
  if (body.email && !SIMPLE_EMAIL_REGEX.test(body.email)) {
    return "Invalid email format";
  }
  return null;
}

function handleError(err, context) {
  console.error(`[/api/data] ${context}:`, err);
  return jsonResponse({ error: "Internal server error" }, 500);
}

export async function GET(request) {
  try {
    await connectToMongo();
    const { collection, id } = getSearchParams(request);

    if (!collection) {
      const isAdmin = await isAdminRequest();
      const colNames = (await listCollections()).filter((n) => {
        if (isProtectedCollection(n)) return false;
        if (!isPublicReadCollection(n) && !isAdmin) return false;
        if (isAdminReadCollection(n) && !isAdmin) return false;
        return true;
      });

      const results = await Promise.all(
        colNames.map(async (name) => {
          const Model = getModelForCollection(name);
          return Model.find({});
        })
      );

      const payload = colNames.reduce((acc, name, idx) => {
        acc[name] = results[idx];
        return acc;
      }, {});

      return jsonResponse(payload, 200);
    }

    const colName = String(collection);

    if (!isValidCollectionName(colName)) {
      return jsonResponse({ error: "Invalid collection name" }, 400);
    }

    if (isProtectedCollection(colName)) {
      return jsonResponse(
        { error: "This collection is protected. Use the dedicated API route instead." },
        403
      );
    }

    if (!isPublicReadCollection(colName)) {
      const authorized = await isAdminRequest();
      if (!authorized) return jsonResponse({ error: "unauthorized" }, 401);
    }

    if (isAdminReadCollection(colName)) {
      const authorized = await isAdminRequest();
      if (!authorized) return jsonResponse({ error: "unauthorized" }, 401);
    }

    const existingCols = await listCollections();
    if (!existingCols.includes(colName)) {
      return jsonResponse({ error: `Collection '${colName}' not found` }, 404);
    }

    const Model = getModelForCollection(colName);

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) return jsonResponse({ error: "Invalid id format" }, 400);
      const doc = await Model.findById(id).lean();
      if (!doc) return jsonResponse({ error: "Document not found" }, 404);
      return jsonResponse(doc, 200);
    }

    const MAX_DOCS_RETURNED = 5000;
    const docs = await Model.find({}).limit(MAX_DOCS_RETURNED).lean();
    return jsonResponse(docs, 200);
  } catch (err) {
    return handleError(err, "GET");
  }
}

export async function POST(request) {
  try {
    await connectToMongo();
    const { collection } = getSearchParams(request);
    if (!collection) return jsonResponse({ error: "Collection is required" }, 400);

    const colName = String(collection);

    if (!isValidCollectionName(colName)) {
      return jsonResponse({ error: "Invalid collection name" }, 400);
    }

    if (isProtectedCollection(colName)) {
      return jsonResponse({ error: "This collection is protected." }, 403);
    }

    const isPublicWrite = PUBLIC_WRITE_COLLECTIONS.has(colName);
    if (!isPublicWrite) {
      const authorized = await isAdminRequest();
      if (!authorized) return jsonResponse({ error: "unauthorized" }, 401);
    }

    if (isPublicWrite) {
      const ip = getClientIp(request);
      if (isRateLimited(ip)) {
        return jsonResponse({ error: "Too many requests, please try again later" }, 429);
      }
    }

    const body = await parseBody(request, isPublicWrite ? MAX_BODY_BYTES_PUBLIC : MAX_BODY_BYTES_ADMIN);
    if (body === null) {
      return jsonResponse({ error: "Invalid or missing JSON body" }, 400);
    }

    let sanitizedBody;
    try {
      sanitizedBody = safeSanitize(body);
    } catch (e) {
      return jsonResponse({ error: e.message || "Invalid payload" }, 400);
    }

    if (isPublicWrite) {
      const validationError = Array.isArray(sanitizedBody)
        ? "Bulk submissions are not allowed for this collection"
        : validateFormPayload(sanitizedBody);
      if (validationError) return jsonResponse({ error: validationError }, 400);
    }

    const Model = getModelForCollection(colName);
    const now = new Date();

    if (Array.isArray(sanitizedBody)) {
      const MAX_BULK_ITEMS = 200;
      if (sanitizedBody.length > MAX_BULK_ITEMS) {
        return jsonResponse({ error: "Too many items in a single request" }, 400);
      }
      const withDates = sanitizedBody.map((item) => ({ ...item, createdAt: now, updatedAt: now }));
      const created = await Model.insertMany(withDates);
      return jsonResponse(created, 201);
    } else {
      const dataWithDate = { ...sanitizedBody, createdAt: now, updatedAt: now };
      const created = await Model.create(dataWithDate);
      return jsonResponse(created, 201);
    }
  } catch (err) {
    return handleError(err, "POST");
  }
}

export async function PUT(request) {
  try {
    await connectToMongo();
    const { collection, id } = getSearchParams(request);
    if (!collection) return jsonResponse({ error: "Collection is required" }, 400);
    if (!id) return jsonResponse({ error: "ID is required for PUT" }, 400);
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonResponse({ error: "Invalid id format" }, 400);

    const colName = String(collection);

    if (!isValidCollectionName(colName)) {
      return jsonResponse({ error: "Invalid collection name" }, 400);
    }

    if (isProtectedCollection(colName)) {
      return jsonResponse({ error: "This collection is protected." }, 403);
    }

    const authorized = await isAdminRequest();
    if (!authorized) return jsonResponse({ error: "unauthorized" }, 401);

    const existingCols = await listCollections();
    if (!existingCols.includes(colName)) return jsonResponse({ error: "Collection not found" }, 404);

    const Model = getModelForCollection(colName);

    const body = await parseBody(request, MAX_BODY_BYTES_ADMIN);
    if (body === null) {
      return jsonResponse({ error: "Invalid or missing JSON body" }, 400);
    }

    let sanitizedBody;
    try {
      sanitizedBody = safeSanitize(body);
    } catch (e) {
      return jsonResponse({ error: e.message || "Invalid payload" }, 400);
    }

    delete sanitizedBody.createdAt;
    sanitizedBody.updatedAt = new Date();

    const updated = await Model.findByIdAndUpdate(id, sanitizedBody, {
      new: true,
      runValidators: false,
      overwrite: false,
    });
    if (!updated) return jsonResponse({ error: "Document not found" }, 404);
    return jsonResponse(updated, 200);
  } catch (err) {
    return handleError(err, "PUT");
  }
}

export async function DELETE(request) {
  try {
    await connectToMongo();
    const { collection, id } = getSearchParams(request);
    if (!collection) return jsonResponse({ error: "Collection is required" }, 400);
    if (!id) return jsonResponse({ error: "ID is required for DELETE" }, 400);
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonResponse({ error: "Invalid id format" }, 400);

    const colName = String(collection);

    if (!isValidCollectionName(colName)) {
      return jsonResponse({ error: "Invalid collection name" }, 400);
    }

    if (isProtectedCollection(colName)) {
      return jsonResponse({ error: "This collection is protected." }, 403);
    }

    const authorized = await isAdminRequest();
    if (!authorized) return jsonResponse({ error: "unauthorized" }, 401);

    const existingCols = await listCollections();
    if (!existingCols.includes(colName)) return jsonResponse({ error: "Collection not found" }, 404);

    const Model = getModelForCollection(colName);

    const deleted = await Model.findByIdAndDelete(id);
    if (!deleted) return jsonResponse({ error: "Document not found" }, 404);
    return jsonResponse(deleted, 200);
  } catch (err) {
    return handleError(err, "DELETE");
  }
}