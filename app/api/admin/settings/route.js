// app/api/admin/settings/route.js — إعدادات المنصة (admin-only).
//   GET   → الإعدادات الحالية + أي قفل جاي من الـ env
//   PATCH { siteRegistrationEnabled?, careerRegistrationEnabled? } → تعديل (بيتسجّل في audit_logs)
import { connectToMongo } from "../../../lib/mongodb";
import { logAudit } from "../../../lib/auditLog";
import { adminGuard, adminJson as json } from "../../../lib/careerAdmin";
import { emailConfigured } from "../../../lib/email";
import {
  getPlatformSettings,
  getPlatformSettingsModel,
  envLocks,
  SETTING_KEYS,
} from "../../../lib/platformSettings";

export async function GET(request) {
  try {
    const g = await adminGuard(request, "admin:settings:get");
    if (g.response) return g.response;
    return json({ settings: await getPlatformSettings(), envLocked: envLocks(), emailConfigured: emailConfigured() });
  } catch (err) {
    console.error("[admin/settings] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function PATCH(request) {
  try {
    const g = await adminGuard(request, "admin:settings:patch", 30);
    if (g.response) return g.response;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_body" }, 400);

    const update = {};
    for (const key of SETTING_KEYS) {
      if (body[key] === undefined) continue;
      if (typeof body[key] !== "boolean") return json({ error: "invalid_body" }, 400);
      update[key] = body[key];
    }
    if (Object.keys(update).length === 0) return json({ error: "nothing_to_update" }, 400);

    await connectToMongo();
    const before = await getPlatformSettings();
    await getPlatformSettingsModel().findOneAndUpdate(
      { key: "main" },
      { $set: update, $setOnInsert: { key: "main" } },
      { upsert: true }
    );
    await logAudit({
      request,
      actor: g.session.user,
      action: "settings.updated",
      details: { from: Object.fromEntries(Object.keys(update).map((k) => [k, before[k]])), to: update },
    });
    return json({ settings: await getPlatformSettings(), envLocked: envLocks(), emailConfigured: emailConfigured() });
  } catch (err) {
    console.error("[admin/settings] PATCH error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
