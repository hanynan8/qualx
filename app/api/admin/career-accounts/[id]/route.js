// app/api/admin/career-accounts/[id]/route.js — حساب كارير واحد (admin-only).
//   GET    → البروفايل + طلبات التقديم + التكليفات + المستحقات + تقدّم الشهادات
//   PATCH  { status?, name?, phone?, newPassword?, revokeSessions?, unlock? }
//   DELETE (?force=1) → حذف الحساب + طلباته وتكليفاته وتقدّم شهاداته.
//          لو عليه مستحقات مالية بيرفض (409 has_pay_records) إلا مع force=1.
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectToMongo } from "../../../../lib/mongodb";
import { logAudit } from "../../../../lib/auditLog";
import { adminGuard, adminJson as json, serializeCareerAccount } from "../../../../lib/careerAdmin";
import { getCareerAccountModel } from "../../../../lib/careerAuth";
import {
  getCareerJobModel,
  getCareerApplicationModel,
  getCareerAssignmentModel,
} from "../../../../lib/careerJobs";
import { notify } from "../../../../lib/email";
import { getPayModel, getCertModel, getCertProgressModel, serializePay } from "../../../../lib/careerExtras";

const isValidPhone = (v) => /^\+?[0-9\s-]{7,20}$/.test(v);

async function loadAccount(params) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return { error: json({ error: "invalid_id" }, 400) };
  await connectToMongo();
  const account = await getCareerAccountModel().findById(id);
  if (!account) return { error: json({ error: "not_found" }, 404) };
  return { account };
}

export async function GET(request, { params }) {
  try {
    const g = await adminGuard(request, "admin:career-accounts:get");
    if (g.response) return g.response;
    const { account, error } = await loadAccount(params);
    if (error) return error;

    const [apps, assigns, pay, progress] = await Promise.all([
      getCareerApplicationModel().find({ accountId: account._id }).sort({ appliedAt: -1 }).limit(200).lean(),
      getCareerAssignmentModel().find({ accountId: account._id }).sort({ assignedAt: -1 }).limit(200).lean(),
      getPayModel().find({ accountId: account._id }).sort({ month: -1, createdAt: -1 }).limit(200).lean(),
      getCertProgressModel().find({ accountId: account._id }).sort({ startedAt: -1 }).limit(200).lean(),
    ]);

    const jobIds = [...new Set([...apps, ...assigns].map((r) => String(r.jobId)))];
    const jobs = await getCareerJobModel().find({ _id: { $in: jobIds } }, "title client").lean();
    const jobById = new Map(jobs.map((j) => [String(j._id), j]));
    const certs = await getCertModel()
      .find({ _id: { $in: progress.map((p) => p.certId) } }, "title")
      .lean();
    const certById = new Map(certs.map((c) => [String(c._id), c]));

    return json({
      account: serializeCareerAccount(account),
      applications: apps.map((a) => ({
        jobId: String(a.jobId),
        jobTitle: jobById.get(String(a.jobId))?.title || "(deleted job)",
        status: a.status,
        proposedDate: a.proposedDate || "",
        appliedAt: a.appliedAt,
      })),
      assignments: assigns.map((a) => ({
        jobId: String(a.jobId),
        jobTitle: jobById.get(String(a.jobId))?.title || "(deleted job)",
        client: jobById.get(String(a.jobId))?.client || "",
        status: a.status,
        assignedAt: a.assignedAt,
      })),
      pay: pay.map(serializePay),
      certifications: progress.map((p) => ({
        certId: String(p.certId),
        title: certById.get(String(p.certId))?.title || "(deleted certification)",
        status: p.status,
        startedAt: p.startedAt,
        completedAt: p.completedAt,
      })),
    });
  } catch (err) {
    console.error("[admin/career-accounts/[id]] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const g = await adminGuard(request, "admin:career-accounts:patch", 40);
    if (g.response) return g.response;
    const { account, error } = await loadAccount(params);
    if (error) return error;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_body" }, 400);

    let newStatus;
    if (body.status !== undefined) {
      if (!["active", "suspended"].includes(body.status)) return json({ error: "invalid_status" }, 400);
      newStatus = body.status;
    }
    let newName;
    if (body.name !== undefined) {
      if (typeof body.name !== "string") return json({ error: "invalid_body" }, 400);
      newName = body.name.trim();
      if (newName.length < 2 || newName.length > 100) return json({ error: "invalid_name" }, 400);
    }
    let newPhone;
    if (body.phone !== undefined) {
      if (typeof body.phone !== "string") return json({ error: "invalid_body" }, 400);
      newPhone = body.phone.trim();
      if (!isValidPhone(newPhone)) return json({ error: "invalid_phone" }, 400);
    }
    let newPassword;
    if (body.newPassword !== undefined) {
      if (typeof body.newPassword !== "string" || body.newPassword.length < 8 || body.newPassword.length > 128) {
        return json({ error: "weak_password" }, 400);
      }
      newPassword = body.newPassword;
    }
    const revokeSessions = body.revokeSessions === true;
    const unlock = body.unlock === true;

    if (
      newStatus === undefined && newName === undefined && newPhone === undefined &&
      newPassword === undefined && !revokeSessions && !unlock
    ) {
      return json({ error: "nothing_to_update" }, 400);
    }

    const prevStatus = account.status || "active";
    const statusChanged = newStatus !== undefined && newStatus !== prevStatus;
    if (statusChanged) account.status = newStatus;
    if (newName !== undefined) account.name = newName;
    if (newPhone !== undefined) account.phone = newPhone;
    if (newPassword !== undefined) {
      account.password = await bcrypt.hash(newPassword, 12);
      account.passwordChangedAt = new Date();
    }
    if (unlock || newPassword !== undefined) {
      account.loginFailedAttempts = 0;
      account.loginFirstFailedAt = null;
      account.loginLockedUntil = null;
    }
    // إيقاف الحساب / تغيير الباسورد / إبطال الجلسات = كل الجلسات المفتوحة تتبطل فورًا.
    if (statusChanged || newPassword !== undefined || revokeSessions) {
      account.tokenVersion = (account.tokenVersion || 0) + 1;
    }
    await account.save();

    const log = (action, details = {}) =>
      logAudit({ request, actor: g.session.user, action, targetId: String(account._id), targetEmail: account.email, details });
    if (statusChanged) await log(newStatus === "suspended" ? "career.account_suspended" : "career.account_reactivated");
    if (newName !== undefined || newPhone !== undefined) await log("career.account_updated");
    if (newPassword !== undefined) await log("career.account_password_reset");
    if (revokeSessions) await log("career.account_sessions_revoked");
    if (unlock) await log("career.account_unlocked");

    // إشعارات بالإيميل (لو Resend متظبط): تغيير باسورد / إيقاف / تفعيل.
    const to = { to: account.email, name: account.name };
    const emailKinds = [];
    if (newPassword !== undefined) emailKinds.push("password_changed");
    if (statusChanged) emailKinds.push(newStatus === "suspended" ? "account_suspended" : "account_reactivated");
    const results = await Promise.all(emailKinds.map((k) => notify(k, to)));

    return json({ account: serializeCareerAccount(account), emailed: results.some((r) => r.sent) });
  } catch (err) {
    console.error("[admin/career-accounts/[id]] PATCH error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const g = await adminGuard(request, "admin:career-accounts:delete", 20);
    if (g.response) return g.response;
    const { account, error } = await loadAccount(params);
    if (error) return error;

    const force = new URL(request.url).searchParams.get("force") === "1";
    const payCount = await getPayModel().countDocuments({ accountId: account._id });
    if (payCount > 0 && !force) return json({ error: "has_pay_records", payCount }, 409);

    const accountId = account._id;
    const [apps, assigns, pay, prog] = await Promise.all([
      getCareerApplicationModel().deleteMany({ accountId }),
      getCareerAssignmentModel().deleteMany({ accountId }),
      getPayModel().deleteMany({ accountId }),
      getCertProgressModel().deleteMany({ accountId }),
    ]);
    const snapshot = { name: account.name, email: account.email, phone: account.phone };
    await getCareerAccountModel().deleteOne({ _id: accountId });

    await logAudit({
      request,
      actor: g.session.user,
      action: "career.account_deleted",
      targetId: String(accountId),
      targetEmail: snapshot.email || null,
      details: {
        ...snapshot,
        removed: {
          applications: apps.deletedCount,
          assignments: assigns.deletedCount,
          payItems: pay.deletedCount,
          certProgress: prog.deletedCount,
        },
      },
    });
    return json({ ok: true });
  } catch (err) {
    console.error("[admin/career-accounts/[id]] DELETE error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
