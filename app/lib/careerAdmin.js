// app/lib/careerAdmin.js — حارس مشترك لراوتات الأدمن الخاصة ببوابة الكارير (admin-only + rate limit).
import { requireRole } from "./rbac";
import { enforceRateLimit } from "./rateLimit";

export const adminJson = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function adminGuard(request, keyPrefix, limit = 60) {
  const auth = await requireRole(["admin"]);
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
