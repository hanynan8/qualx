// app/lib/auditLog.js
//
// تسجيل الأحداث الأمنية (دخول ناجح/فاشل، قفل حساب، فشل MFA...) في كولكشن
// "audit_logs". بيتنادى بعد حدوث الحدث فعليًا. فشل الكتابة هنا مابيوقفش
// العملية الأساسية (مثلاً تسجيل الدخول)، بس بيتسجل في لوجات السيرفر.

import { connectToMongo, getAuditLogModel } from "./mongodb";
import { getClientIp } from "./rateLimit";

function readHeader(request, name) {
  const h = request?.headers;
  if (!h) return null;
  return (typeof h.get === "function" ? h.get(name) : h[name]) || null;
}

export async function logAudit({
  request,
  actor,
  action,
  targetId = null,
  targetEmail = null,
  details = {},
}) {
  try {
    await connectToMongo();
    const AuditLog = getAuditLogModel();
    const ip = getClientIp(request);
    await AuditLog.create({
      action,
      actorId: actor?.id ? String(actor.id) : null,
      actorEmail: actor?.email || null,
      actorName: actor?.name || null,
      targetId,
      targetEmail,
      details,
      ip: ip === "unknown" ? null : ip,
      userAgent: readHeader(request, "user-agent"),
    });
  } catch (err) {
    console.error("[auditLog] failed to write entry:", err, { action });
  }
}
