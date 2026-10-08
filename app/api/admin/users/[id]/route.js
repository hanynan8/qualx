// app/api/admin/users/[id]/route.js
//
// PATCH: تغيير role و/أو status. DELETE: حذف مستخدم. admin-only، وكل إجراء
// بيتسجّل في audit_logs. أي تعديل حساس بيزوّد tokenVersion عشان جلسات الحساب
// المفتوحة تتبطل خلال ~60 ثانية.

import mongoose from "mongoose";
import { connectToMongo, getAuthModel, USER_ROLES } from "../../../../lib/mongodb";
import { logAudit } from "../../../../lib/auditLog";
import { requireRole } from "../../../../lib/rbac";
import { enforceRateLimit } from "../../../../lib/rateLimit";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

const ALLOWED_ROLES = new Set(USER_ROLES);
const ALLOWED_STATUSES = new Set(["active", "suspended"]);

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
    const newRole = body?.role;
    const newStatus = body?.status;
    if (newRole === undefined && newStatus === undefined) return json({ error: "nothing_to_update" }, 400);
    if (newRole !== undefined && !ALLOWED_ROLES.has(newRole)) return json({ error: "invalid_role" }, 400);
    if (newStatus !== undefined && !ALLOWED_STATUSES.has(newStatus)) return json({ error: "invalid_status" }, 400);

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

    const roleChanged = newRole !== undefined && newRole !== previousRole;
    const statusChanged = newStatus !== undefined && newStatus !== previousStatus;
    if (!roleChanged && !statusChanged) {
      return json({ id: target._id.toString(), role: previousRole, status: previousStatus, unchanged: true });
    }

    if (roleChanged) target.role = newRole;
    if (statusChanged) target.status = newStatus;
    target.tokenVersion = (target.tokenVersion || 0) + 1;
    await target.save();

    if (roleChanged) {
      await logAudit({
        request,
        actor: session.user,
        action: "user.role_changed",
        targetId: target._id.toString(),
        targetEmail: target.email || null,
        details: { from: previousRole, to: newRole },
      });
    }
    if (statusChanged) {
      await logAudit({
        request,
        actor: session.user,
        action: newStatus === "suspended" ? "user.suspended" : "user.reactivated",
        targetId: target._id.toString(),
        targetEmail: target.email || null,
        details: { from: previousStatus, to: newStatus },
      });
    }

    return json({ id: target._id.toString(), role: target.role, status: target.status, name: target.name, email: target.email });
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

    await logAudit({
      request,
      actor: session.user,
      action: "user.deleted",
      targetId: id,
      targetEmail: snapshot.email || null,
      details: snapshot,
    });

    return json({ id, deleted: true });
  } catch (err) {
    console.error("[/api/admin/users/[id]] DELETE error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
