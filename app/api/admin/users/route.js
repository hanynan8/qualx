// app/api/admin/users/route.js
//
// قائمة المستخدمين للأدمن (admin-only). بيرجع البيانات من غير الباسورد
// وأسرار MFA أبدًا — الاستبعاد في الـ query نفسه.

import { connectToMongo, getAuthModel } from "../../../lib/mongodb";
import { requireRole } from "../../../lib/rbac";
import { enforceRateLimit } from "../../../lib/rateLimit";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

const MAX_USERS_RETURNED = 2000;

export async function GET(request) {
  try {
    const auth = await requireRole(["admin"]);
    if (auth.response) return auth.response;

    const rl = await enforceRateLimit(request, {
      keyPrefix: "admin:users:list",
      limit: 30,
      windowSeconds: 60,
      extraKey: `user:${auth.session.user.id}`,
    });
    if (rl) return rl;

    await connectToMongo();
    const users = await getAuthModel()
      .find({}, "-password -mfaSecret -mfaBackupCodeHashes -tokenVersion -loginFailedAttempts -loginFirstFailedAt")
      .sort({ createdAt: -1 })
      .limit(MAX_USERS_RETURNED)
      .lean();

    return json(
      users.map((u) => ({
        _id: String(u._id),
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        role: u.role || "user",
        status: u.status || "active",
        mfaEnabled: !!u.mfaEnabled,
        lockedUntil: u.loginLockedUntil || null,
        createdAt: u.createdAt || null,
      }))
    );
  } catch (err) {
    console.error("[/api/admin/users] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
