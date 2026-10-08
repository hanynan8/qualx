// app/api/admin/content/route.js
//
// الـ API الحقيقي للوحة الأدمن: CRUD كامل على أي كولكشن في الداتابيز
// (home, services, careers, navbar, footer, form, أو أي كولكشن تاني)
// ما عدا الكولكشنز المحمية (auth, audit_logs).
//
// الحماية على 3 طبقات:
//   1) proxy.js: أي طلب لـ /api/admin/* من غير توكن admin يتقفل قبل الوصول هنا.
//   2) requireRole(["admin"]) تحت: فحص صارم من الداتابيز (الحساب موقوف؟ الـ
//      role اتغير؟) في كل طلب.
//   3) تعقيم الـ payload + حدود حجم + سجل تدقيق لكل كتابة.
//
// الواجهة:
//   GET    /api/admin/content                        → { collections: [{ name, count, protected }] }
//   GET    /api/admin/content?collection=navbar      → { collection, exists, docs: [...] }
//   POST   /api/admin/content?collection=navbar      → ينشئ document (object) — أو كولكشن جديد لو مش موجود
//   PUT    /api/admin/content?collection=navbar&id=… → يستبدل الـ document بالكامل
//            (&ifUpdatedAt=<ISO> اختياري: لو الـ document اتعدّل من حد تاني
//             بعد كده بيرجع 409 بدل ما يدوس على تعديله)
//   DELETE /api/admin/content?collection=navbar&id=… → يمسح document

import mongoose from "mongoose";
import { requireRole } from "../../../lib/rbac";
import { connectToMongo } from "../../../lib/mongodb";
import { logAudit } from "../../../lib/auditLog";
import {
  isValidCollectionName,
  isProtectedCollection,
  sanitizeObject,
  stripServerFields,
  getModelForCollection,
  listCollectionNames,
} from "../../../lib/contentGuard";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_DOCS_RETURNED = 2000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}

function fail(err, context) {
  console.error(`[/api/admin/content] ${context}:`, err);
  return json({ error: "Internal server error" }, 500);
}

async function readJsonObject(request) {
  const raw = await request.text();
  if (!raw) return { error: "Missing JSON body" };
  if (raw.length > MAX_BODY_BYTES) return { error: "Payload too large" };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Invalid JSON" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { error: "Body must be a JSON object" };
  }
  try {
    return { body: stripServerFields(sanitizeObject(parsed)) };
  } catch (e) {
    return { error: e.message || "Invalid payload" };
  }
}

// يتحقق من اسم الكولكشن + إنه مش محمي. بيرجع Response جاهز لو فيه مشكلة.
function checkCollection(name) {
  if (!name) return json({ error: "Collection is required" }, 400);
  if (!isValidCollectionName(name)) return json({ error: "Invalid collection name" }, 400);
  if (isProtectedCollection(name)) return json({ error: "This collection is protected." }, 403);
  return null;
}

function toIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(request) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;

  try {
    await connectToMongo();
    const url = new URL(request.url);
    const collection = url.searchParams.get("collection");

    if (!collection) {
      const names = (await listCollectionNames()).filter((n) => !isProtectedCollection(n));
      const collections = await Promise.all(
        names.map(async (name) => ({
          name,
          count: await getModelForCollection(name).estimatedDocumentCount(),
        }))
      );
      collections.sort((a, b) => a.name.localeCompare(b.name));
      return json({ collections });
    }

    const bad = checkCollection(collection);
    if (bad) return bad;

    const exists = (await listCollectionNames()).includes(collection);
    if (!exists) return json({ collection, exists: false, docs: [] });

    const docs = await getModelForCollection(collection)
      .find({})
      .sort({ createdAt: 1, _id: 1 })
      .limit(MAX_DOCS_RETURNED)
      .lean();
    return json({ collection, exists: true, docs });
  } catch (err) {
    return fail(err, "GET");
  }
}

export async function POST(request) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;

  try {
    await connectToMongo();
    const collection = new URL(request.url).searchParams.get("collection");
    const bad = checkCollection(collection);
    if (bad) return bad;

    const { body, error } = await readJsonObject(request);
    if (error) return json({ error }, 400);

    const now = new Date();
    const created = await getModelForCollection(collection).create({
      ...body,
      createdAt: now,
      updatedAt: now,
    });

    await logAudit({
      request,
      actor: auth.session.user,
      action: "content.create",
      targetId: String(created._id),
      details: { collection },
    });
    return json(created, 201);
  } catch (err) {
    return fail(err, "POST");
  }
}

export async function PUT(request) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;

  try {
    await connectToMongo();
    const params = new URL(request.url).searchParams;
    const collection = params.get("collection");
    const id = params.get("id");
    const ifUpdatedAt = params.get("ifUpdatedAt");

    const bad = checkCollection(collection);
    if (bad) return bad;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return json({ error: "Invalid id" }, 400);

    const { body, error } = await readJsonObject(request);
    if (error) return json({ error }, 400);

    const Model = getModelForCollection(collection);
    const _id = new mongoose.Types.ObjectId(id);
    const existing = await Model.collection.findOne({ _id });
    if (!existing) return json({ error: "Document not found" }, 404);

    // Optimistic concurrency: لو الأدمن فاتح الصفحة من فترة والـ document
    // اتغير من تاب/أدمن تاني، نرفض بدل ما نمسح تعديل حد.
    if (ifUpdatedAt && existing.updatedAt && toIso(existing.updatedAt) !== toIso(ifUpdatedAt)) {
      return json(
        { error: "Document was modified by someone else. Reload and try again.", code: "CONFLICT" },
        409
      );
    }

    const replacement = {
      ...body,
      createdAt: existing.createdAt || new Date(),
      updatedAt: new Date(),
    };
    await Model.collection.replaceOne({ _id }, replacement);

    await logAudit({
      request,
      actor: auth.session.user,
      action: "content.update",
      targetId: id,
      details: { collection },
    });
    return json({ _id: id, ...replacement });
  } catch (err) {
    return fail(err, "PUT");
  }
}

export async function DELETE(request) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;

  try {
    await connectToMongo();
    const params = new URL(request.url).searchParams;
    const collection = params.get("collection");
    const id = params.get("id");

    const bad = checkCollection(collection);
    if (bad) return bad;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return json({ error: "Invalid id" }, 400);

    const deleted = await getModelForCollection(collection).findByIdAndDelete(id);
    if (!deleted) return json({ error: "Document not found" }, 404);

    await logAudit({
      request,
      actor: auth.session.user,
      action: "content.delete",
      targetId: id,
      details: { collection },
    });
    return json({ ok: true, _id: id });
  } catch (err) {
    return fail(err, "DELETE");
  }
}
