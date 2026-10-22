// app/api/admin/cv/[id]/route.js
//
// GET    : بيبعت ملف الـ PDF للأدمن (inline للعرض، أو ?download=1 للتحميل).
//          الملف private في التخزين، فالسيرفر هو الوسيط الوحيد وبيتحقق من الـ role.
// DELETE : بيمسح الملف من التخزين + السجل، وبيتسجّل في audit_logs.

import mongoose from "mongoose";
import { connectToMongo } from "../../../../lib/mongodb";
import { getCvModel } from "../../../../lib/cvModel";
import { readCv, deleteCv } from "../../../../lib/cvStorage";
import { logAudit } from "../../../../lib/auditLog";
import { requireRole } from "../../../../lib/rbac";
import { enforceRateLimit } from "../../../../lib/rateLimit";

export const runtime = "nodejs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// Content-Disposition يدعم الأسماء العربية (RFC 5987) مع fallback ASCII.
function contentDisposition(type, fileName) {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request, { params }) {
  try {
    const auth = await requireRole(["admin"]);
    if (auth.response) return auth.response;

    const rl = await enforceRateLimit(request, {
      keyPrefix: "admin:cv:file",
      limit: 60,
      windowSeconds: 60,
      extraKey: `user:${auth.session.user.id}`,
    });
    if (rl) return rl;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return json({ error: "invalid_id" }, 400);

    await connectToMongo();
    const doc = await getCvModel().findById(id).lean();
    if (!doc?.file) return json({ error: "not_found" }, 404);

    const result = await readCv(doc.file);
    if (!result) return json({ error: "file_missing" }, 404);

    const download = new URL(request.url).searchParams.get("download") === "1";
    return new Response(result.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(result.size),
        "Content-Disposition": contentDisposition(download ? "attachment" : "inline", doc.file.name || "cv.pdf"),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[/api/admin/cv/[id]] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireRole(["admin"]);
    if (auth.response) return auth.response;
    const { session } = auth;

    const rl = await enforceRateLimit(request, {
      keyPrefix: "admin:cv:delete",
      limit: 30,
      windowSeconds: 60,
      extraKey: `user:${session.user.id}`,
    });
    if (rl) return rl;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return json({ error: "invalid_id" }, 400);

    await connectToMongo();
    const Model = getCvModel();
    const doc = await Model.findById(id).lean();
    if (!doc) return json({ error: "not_found" }, 404);

    // الملف الأول: لو مسحه فشل (مشكلة شبكة مثلًا) بنوقف ومنمسحش السجل، عشان منفقدش
    // الإشارة للملف ويفضل يتيم في التخزين.
    if (doc.file) await deleteCv(doc.file);
    await Model.deleteOne({ _id: id });

    await logAudit({
      request,
      actor: session.user,
      action: "cv.delete",
      targetId: String(id),
      targetEmail: doc.email || null,
      details: { name: doc.name, position: doc.position },
    });

    return json({ ok: true });
  } catch (err) {
    console.error("[/api/admin/cv/[id]] DELETE error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
