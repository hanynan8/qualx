// app/api/admin/users/[id]/route.js
//
// PATCH: تغيير role و/أو status. DELETE: حذف مستخدم. admin-only، وكل إجراء
// بيتسجّل في audit_logs. أي تعديل حساس بيزوّد tokenVersion عشان جلسات الحساب
// المفتوحة تتبطل خلال ~60 ثانية.

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectToMongo, getAuthModel, USER_ROLES } from "../../../../lib/mongodb";
import { logAudit } from "../../../../lib/auditLog";
import { requireRole } from "../../../../lib/rbac";
import { notify } from "../../../../lib/email";
import { MsBranch, MsVisit, MsAction, MsSettings } from "../../../../lib/mysteryDb";
import { AuBranch, AuVisit, AuFinding, AuSettings } from "../../../../lib/auditDb";
import { enforceRateLimit } from "../../../../lib/rateLimit";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

const ALLOWED_ROLES = new Set(USER_ROLES);
const ALLOWED_STATUSES = new Set(["active", "suspended"]);

const ALLOWED_DASHBOARDS = new Set(["mystery", "audit"]);
const isValidPhone = (v) => /^\+?[0-9\s-]{7,20}$/.test(v);

export async function PATCH(request, { params }) {
  try {
    const auth = await requireRole(["admin"]);
    if (auth.response) return auth.response;
    const { session } = auth;

    const rl = await enforceRateLimit(request, {
      keyPrefix: "admin:users:patch",
      limit: 30,
      windowSeconds: 60,
      extraKey: `user:${session.user.id}`,
    });
    if (rl) return rl;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return json({ error: "invalid_id" }, 400);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_body" }, 400);

    const newRole = body.role;
    const newStatus = body.status;
    if (newRole !== undefined && !ALLOWED_ROLES.has(newRole)) return json({ error: "invalid_role" }, 400);
    if (newStatus !== undefined && !ALLOWED_STATUSES.has(newStatus)) return json({ error: "invalid_status" }, 400);

    // حقول الملف الشخصي
    let newName;
    let newPhone;
    if (body.name !== undefined) {
      if (typeof body.name !== "string") return json({ error: "invalid_body" }, 400);
      newName = body.name.trim();
      if (newName.length < 2 || newName.length > 100 || newName.includes("@")) return json({ error: "invalid_name" }, 400);
    }
    if (body.phone !== undefined) {
      if (typeof body.phone !== "string") return json({ error: "invalid_body" }, 400);
      newPhone = body.phone.trim();
      if (!isValidPhone(newPhone)) return json({ error: "invalid_phone" }, 400);
    }

    // إجراءات الأمان
    let newPassword;
    if (body.newPassword !== undefined) {
      if (typeof body.newPassword !== "string" || body.newPassword.length < 8 || body.newPassword.length > 128) {
        return json({ error: "weak_password" }, 400);
      }
      newPassword = body.newPassword;
    }
    const revokeSessions = body.revokeSessions === true;
    const unlock = body.unlock === true;
    const resetMfa = body.resetMfa === true;

    let newBlocked;
    if (body.blockedDashboards !== undefined) {
      if (!Array.isArray(body.blockedDashboards) || body.blockedDashboards.some((k) => !ALLOWED_DASHBOARDS.has(k))) {
        return json({ error: "invalid_dashboards" }, 400);
      }
      newBlocked = [...new Set(body.blockedDashboards)];
    }

    const nothing =
      newRole === undefined && newStatus === undefined && newName === undefined && newPhone === undefined &&
      newPassword === undefined && newBlocked === undefined && !revokeSessions && !unlock && !resetMfa;
    if (nothing) return json({ error: "nothing_to_update" }, 400);

    await connectToMongo();
    const AuthModel = getAuthModel();
    const target = await AuthModel.findById(id);
    if (!target) return json({ error: "not_found" }, 404);

    const previousRole = target.role || "user";
    const previousStatus = target.status || "active";
    const isSelf = target._id.toString() === String(session.user.id);

    // الأدمن ميقدرش ينزّل/يوقف نفسه لو هو آخر أدمن شغّال.
    if (isSelf && previousRole === "admin" && newRole !== undefined && newRole !== "admin") {
      const adminCount = await AuthModel.countDocuments({ role: "admin" });
      if (adminCount <= 1) return json({ error: "last_admin_protection" }, 400);
    }
    if (isSelf && newStatus === "suspended") {
      const activeAdmins = await AuthModel.countDocuments({ role: "admin", status: { $ne: "suspended" } });
      if (previousRole === "admin" && activeAdmins <= 1) return json({ error: "last_admin_protection" }, 400);
    }
    // مفيش إجراءات بتبطّل جلستك أنت من هنا (احتياط من قفل نفسك بره اللوحة).
    if (isSelf && (newPassword !== undefined || revokeSessions || resetMfa)) {
      return json({ error: "cannot_target_self" }, 400);
    }

    const roleChanged = newRole !== undefined && newRole !== previousRole;
    const statusChanged = newStatus !== undefined && newStatus !== previousStatus;
    const nameChanged = newName !== undefined && newName !== target.name;
    const phoneChanged = newPhone !== undefined && newPhone !== target.phone;
    const blockedChanged =
      newBlocked !== undefined &&
      JSON.stringify([...newBlocked].sort()) !== JSON.stringify([...(target.blockedDashboards || [])].sort());

    if (nameChanged) {
      const dup = await AuthModel.exists({
        _id: { $ne: target._id },
        name: new RegExp(`^${newName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      });
      if (dup) return json({ error: "name_taken" }, 409);
    }

    const sensitive = roleChanged || statusChanged || newPassword !== undefined || revokeSessions || resetMfa;
    const nothingChanged =
      !roleChanged && !statusChanged && !nameChanged && !phoneChanged && !blockedChanged &&
      newPassword === undefined && !revokeSessions && !unlock && !resetMfa;
    if (nothingChanged) {
      return json({ id: target._id.toString(), role: previousRole, status: previousStatus, unchanged: true });
    }

    if (roleChanged) target.role = newRole;
    if (statusChanged) target.status = newStatus;
    if (nameChanged) target.name = newName;
    if (phoneChanged) target.phone = newPhone;
    if (blockedChanged) target.blockedDashboards = newBlocked;
    if (newPassword !== undefined) {
      target.password = await bcrypt.hash(newPassword, 12);
      target.passwordChangedAt = new Date();
    }
    if (unlock || newPassword !== undefined) {
      target.loginFailedAttempts = 0;
      target.loginFirstFailedAt = null;
      target.loginLockedUntil = null;
    }
    if (resetMfa) {
      target.mfaEnabled = false;
      target.mfaSecret = null;
      target.mfaBackupCodeHashes = [];
    }
    if (sensitive) target.tokenVersion = (target.tokenVersion || 0) + 1;
    await target.save();

    const log = (action, details = {}) =>
      logAudit({
        request,
        actor: session.user,
        action,
        targetId: target._id.toString(),
        targetEmail: target.email || null,
        details,
      });

    if (roleChanged) await log("user.role_changed", { from: previousRole, to: newRole });
    if (statusChanged) {
      await log(newStatus === "suspended" ? "user.suspended" : "user.reactivated", { from: previousStatus, to: newStatus });
    }
    if (nameChanged || phoneChanged) await log("user.profile_updated", { name: nameChanged, phone: phoneChanged });
    if (newPassword !== undefined) await log("user.password_reset");
    if (revokeSessions) await log("user.sessions_revoked");
    if (unlock) await log("user.unlocked");
    if (resetMfa) await log("user.mfa_reset");
    if (blockedChanged) await log("user.dashboards_changed", { blockedDashboards: newBlocked });

    const emailKinds = [];
    if (newPassword !== undefined) emailKinds.push("password_changed");
    if (statusChanged) emailKinds.push(newStatus === "suspended" ? "account_suspended" : "account_reactivated");
    const mailResults = await Promise.all(emailKinds.map((k) => notify(k, { to: target.email, name: target.name })));

    return json({
      id: target._id.toString(),
      emailed: mailResults.some((r) => r.sent),
      role: target.role,
      status: target.status,
      name: target.name,
      email: target.email,
      phone: target.phone,
      mfaEnabled: !!target.mfaEnabled,
      lockedUntil: target.loginLockedUntil || null,
      blockedDashboards: target.blockedDashboards || [],
    });
  } catch (err) {
    console.error("[/api/admin/users/[id]] PATCH error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireRole(["admin"]);
    if (auth.response) return auth.response;
    const { session } = auth;

    const rl = await enforceRateLimit(request, {
      keyPrefix: "admin:users:delete",
      limit: 20,
      windowSeconds: 60,
      extraKey: `user:${session.user.id}`,
    });
    if (rl) return rl;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return json({ error: "invalid_id" }, 400);
    if (id === String(session.user.id)) return json({ error: "cannot_delete_self" }, 400);

    await connectToMongo();
    const AuthModel = getAuthModel();
    const target = await AuthModel.findById(id);
    if (!target) return json({ error: "not_found" }, 404);

    if ((target.role || "user") === "admin") {
      const adminCount = await AuthModel.countDocuments({ role: "admin" });
      if (adminCount <= 1) return json({ error: "last_admin_protection" }, 400);
    }

    const snapshot = { name: target.name, email: target.email, role: target.role };
    await AuthModel.findByIdAndDelete(id);

    // تنظيف بيانات الحساب في داشبوردات Mystery Shopping والـ Auditing (كلها مفلترة بـ owner).
    const cleaned = {};
    try {
      const results = await Promise.all(
        [["ms_branches", MsBranch], ["ms_visits", MsVisit], ["ms_actions", MsAction], ["ms_settings", MsSettings],
         ["au_branches", AuBranch], ["au_visits", AuVisit], ["au_findings", AuFinding], ["au_settings", AuSettings]]
          .map(async ([name, M]) => [name, (await M().deleteMany({ owner: id })).deletedCount])
      );
      for (const [name, n] of results) if (n) cleaned[name] = n;
    } catch (err) {
      console.error("[admin/users] dashboard data cleanup failed:", err);
    }

    await logAudit({
      request,
      actor: session.user,
      action: "user.deleted",
      targetId: id,
      targetEmail: snapshot.email || null,
      details: { ...snapshot, removedData: cleaned },
    });

    return json({ id, deleted: true });
  } catch (err) {
    console.error("[/api/admin/users/[id]] DELETE error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
