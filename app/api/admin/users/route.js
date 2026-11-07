// app/api/admin/users/route.js
//
// قائمة المستخدمين للأدمن (admin-only). بيرجع البيانات من غير الباسورد
// وأسرار MFA أبدًا — الاستبعاد في الـ query نفسه.

import bcrypt from "bcryptjs";
import { connectToMongo, getAuthModel, USER_ROLES } from "../../../lib/mongodb";
import { logAudit } from "../../../lib/auditLog";
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
        blockedDashboards: Array.isArray(u.blockedDashboards) ? u.blockedDashboards : [],
        createdAt: u.createdAt || null,
      }))
    );
  } catch (err) {
    console.error("[/api/admin/users] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^\+?[0-9\s-]{7,20}$/.test(v);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// إنشاء حساب مباشرة من الأدمن (مثلًا لعميل أو أدمن جديد) — بيتخطى قفل التسجيل العام.
export async function POST(request) {
  try {
    const auth = await requireRole(["admin"]);
    if (auth.response) return auth.response;

    const rl = await enforceRateLimit(request, {
      keyPrefix: "admin:users:create",
      limit: 20,
      windowSeconds: 60,
      extraKey: `user:${auth.session.user.id}`,
    });
    if (rl) return rl;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_body" }, 400);
    for (const f of ["name", "email", "phone", "password", "role"]) {
      if (body[f] !== undefined && typeof body[f] !== "string") return json({ error: "invalid_body" }, 400);
    }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const password = body.password || "";
    const role = body.role === undefined ? "user" : body.role;

    if (!name || !email || !phone || !password) return json({ error: "missing_fields" }, 400);
    if (name.length < 2 || name.length > 100 || name.includes("@")) return json({ error: "invalid_name" }, 400);
    if (email.length > 254 || !isValidEmail(email)) return json({ error: "invalid_email" }, 400);
    if (!isValidPhone(phone)) return json({ error: "invalid_phone" }, 400);
    if (password.length < 8 || password.length > 128) return json({ error: "weak_password" }, 400);
    if (!USER_ROLES.includes(role)) return json({ error: "invalid_role" }, 400);

    await connectToMongo();
    const AuthModel = getAuthModel();
    const existing = await AuthModel.findOne(
      { $or: [{ email }, { name: new RegExp(`^${escapeRegex(name)}$`, "i") }] },
      "name email"
    ).lean();
    if (existing) return json({ error: existing.email?.toLowerCase().trim() === email ? "email_taken" : "name_taken" }, 409);

    let created;
    try {
      created = await AuthModel.create({
        name,
        email,
        phone,
        password: await bcrypt.hash(password, 12),
        role,
        status: "active",
        tokenVersion: 0,
        passwordChangedAt: new Date(),
      });
    } catch (err) {
      if (err?.code === 11000) return json({ error: "email_taken" }, 409);
      throw err;
    }

    await logAudit({
      request,
      actor: auth.session.user,
      action: "user.created",
      targetId: String(created._id),
      targetEmail: created.email,
      details: { role },
    });

    return json(
      {
        _id: String(created._id),
        name: created.name,
        email: created.email,
        phone: created.phone,
        role: created.role,
        status: "active",
        mfaEnabled: false,
        lockedUntil: null,
        blockedDashboards: [],
        createdAt: created.createdAt,
      },
      201
    );
  } catch (err) {
    console.error("[/api/admin/users] POST error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
