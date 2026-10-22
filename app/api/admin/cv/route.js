// app/api/admin/cv/route.js
//
// قائمة طلبات التقديم بالـ CV للأدمن (admin-only). مش بنرجّع مفاتيح التخزين
// الداخلية (file.key / file.storage) — الملف نفسه بيتجاب من /api/admin/cv/[id].

import { connectToMongo } from "../../../lib/mongodb";
import { getCvModel } from "../../../lib/cvModel";
import { requireRole } from "../../../lib/rbac";
import { enforceRateLimit } from "../../../lib/rateLimit";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

const MAX_RETURNED = 2000;

export async function GET(request) {
  try {
    const auth = await requireRole(["admin"]);
    if (auth.response) return auth.response;

    const rl = await enforceRateLimit(request, {
      keyPrefix: "admin:cv:list",
      limit: 30,
      windowSeconds: 60,
      extraKey: `user:${auth.session.user.id}`,
    });
    if (rl) return rl;

    await connectToMongo();
    const docs = await getCvModel().find({}).sort({ createdAt: -1 }).limit(MAX_RETURNED).lean();

    return json({
      docs: docs.map((d) => ({
        _id: String(d._id),
        name: d.name || "",
        email: d.email || "",
        phone: d.phone || "",
        position: d.position || "",
        message: d.message || "",
        link: d.link || "",
        fileName: d.file?.name || "cv.pdf",
        fileSize: d.file?.size || 0,
        createdAt: d.createdAt || null,
      })),
    });
  } catch (err) {
    console.error("[/api/admin/cv] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
