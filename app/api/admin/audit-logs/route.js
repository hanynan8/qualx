// app/api/admin/audit-logs/route.js
//
// آخر الأحداث الموثّقة (دخول، فشل MFA، تعديلات الأدمن). admin-only
// ومحدود بعدد أقصى لكل طلب.

import { connectToMongo, getAuditLogModel } from "../../../lib/mongodb";
import { requireRole } from "../../../lib/rbac";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

const MAX_LOGS_RETURNED = 500;

export async function GET(request) {
  try {
    const auth = await requireRole(["admin"]);
    if (auth.response) return auth.response;

    const url = new URL(request.url);
    const limitParam = parseInt(url.searchParams.get("limit"), 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), MAX_LOGS_RETURNED) : 100;

    await connectToMongo();
    const logs = await getAuditLogModel().find({}).sort({ createdAt: -1 }).limit(limit).lean();

    return json(
      logs.map((l) => ({
        id: String(l._id),
        action: l.action,
        actorEmail: l.actorEmail,
        actorName: l.actorName,
        targetId: l.targetId,
        targetEmail: l.targetEmail,
        details: l.details,
        ip: l.ip,
        createdAt: l.createdAt,
      }))
    );
  } catch (err) {
    console.error("[/api/admin/audit-logs] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
