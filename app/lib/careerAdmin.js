// app/lib/careerAdmin.js — حارس مشترك لراوتات الأدمن الخاصة ببوابة الكارير (admin-only + rate limit).
import { requireRole, CAREER_ROLES } from "./rbac";
import { enforceRateLimit } from "./rateLimit";

export const adminJson = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function adminGuard(request, keyPrefix, limit = 60) {
  // راوتات الكارير (admin:career-*) مفتوحة لـ hr كمان؛ باقي الراوتات (settings...) admin بس.
  const auth = await requireRole(keyPrefix.startsWith("admin:career-") ? CAREER_ROLES : ["admin"]);
  if (auth.response) return { response: auth.response };
  const rl = await enforceRateLimit(request, {
    keyPrefix,
    limit,
    windowSeconds: 60,
    extraKey: `user:${auth.session.user.id}`,
  });
  if (rl) return { response: rl };
  return { session: auth.session };
}

// الشكل اللي بيوصل لواجهة الأدمن لحساب كارير (من غير الباسورد/الـ tokenVersion).
export function serializeCareerAccount(a, extra = {}) {
  return {
    id: String(a._id),
    name: a.name || "",
    email: a.email || "",
    phone: a.phone || "",
    status: a.status || "active",
    lockedUntil: a.loginLockedUntil && new Date(a.loginLockedUntil) > new Date() ? a.loginLockedUntil : null,
    createdAt: a.createdAt || null,
    ...extra,
  };
}
