// app/api/admin/career-accounts/route.js — إدارة حسابات بوابة الكارير (الفريلانسرز) (admin-only).
//   GET  → كل الحسابات + أعدادهم (طلبات، تكليفات، مستحقات معلّقة، شهادات)
//   POST { name, email, phone, password } → إنشاء حساب مباشرة من الأدمن (بيتخطى قفل التسجيل)
import bcrypt from "bcryptjs";
import { connectToMongo } from "../../../lib/mongodb";
import { logAudit } from "../../../lib/auditLog";
import { adminGuard, adminJson as json, serializeCareerAccount } from "../../../lib/careerAdmin";
import { getCareerAccountModel } from "../../../lib/careerAuth";
import {
  getCareerApplicationModel,
  getCareerAssignmentModel,
  ACTIVE_ASSIGNMENT_STATUSES,
} from "../../../lib/careerJobs";
import { getPayModel, getCertProgressModel } from "../../../lib/careerExtras";

const MAX_ACCOUNTS = 3000;

const countBy = (rows) => new Map(rows.map((r) => [String(r._id), r.n]));

export async function GET(request) {
  try {
    const g = await adminGuard(request, "admin:career-accounts:list");
    if (g.response) return g.response;

    await connectToMongo();
    const accounts = await getCareerAccountModel()
      .find({}, "name email phone status loginLockedUntil createdAt")
      .sort({ createdAt: -1 })
      .limit(MAX_ACCOUNTS)
      .lean();

    const group = (match) => [{ $match: match }, { $group: { _id: "$accountId", n: { $sum: 1 } } }];
    const [apps, pendingApps, activeJobs, doneJobs, pendingPay, certsDone] = await Promise.all([
      getCareerApplicationModel().aggregate(group({})),
      getCareerApplicationModel().aggregate(group({ status: "under_review" })),
      getCareerAssignmentModel().aggregate(group({ status: { $in: ACTIVE_ASSIGNMENT_STATUSES } })),
      getCareerAssignmentModel().aggregate(group({ status: "completed" })),
      getPayModel().aggregate(group({ status: "pending_review" })),
      getCertProgressModel().aggregate(group({ status: "completed" })),
    ]);
    const m = {
      apps: countBy(apps),
      pendingApps: countBy(pendingApps),
      activeJobs: countBy(activeJobs),
      doneJobs: countBy(doneJobs),
      pendingPay: countBy(pendingPay),
      certsDone: countBy(certsDone),
    };

    return json({
      items: accounts.map((a) => {
        const id = String(a._id);
        return serializeCareerAccount(a, {
          applications: m.apps.get(id) || 0,
          pendingApplications: m.pendingApps.get(id) || 0,
          activeJobs: m.activeJobs.get(id) || 0,
          completedJobs: m.doneJobs.get(id) || 0,
          pendingPay: m.pendingPay.get(id) || 0,
          certificationsCompleted: m.certsDone.get(id) || 0,
        });
      }),
    });
  } catch (err) {
    console.error("[admin/career-accounts] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^\+?[0-9\s-]{7,20}$/.test(v);

export async function POST(request) {
  try {
    const g = await adminGuard(request, "admin:career-accounts:create", 20);
    if (g.response) return g.response;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_body" }, 400);
    for (const f of ["name", "email", "phone", "password"]) {
      if (body[f] !== undefined && typeof body[f] !== "string") return json({ error: "invalid_body" }, 400);
    }
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const password = body.password || "";

    if (!name || !email || !phone || !password) return json({ error: "missing_fields" }, 400);
    if (name.length < 2 || name.length > 100) return json({ error: "invalid_name" }, 400);
    if (email.length > 254 || !isValidEmail(email)) return json({ error: "invalid_email" }, 400);
    if (!isValidPhone(phone)) return json({ error: "invalid_phone" }, 400);
    if (password.length < 8 || password.length > 128) return json({ error: "weak_password" }, 400);

    await connectToMongo();
    const Account = getCareerAccountModel();
    if (await Account.exists({ email })) return json({ error: "email_taken" }, 409);

    let created;
    try {
      created = await Account.create({
        name,
        email,
        phone,
        password: await bcrypt.hash(password, 12),
        status: "active",
        passwordChangedAt: new Date(),
      });
    } catch (err) {
      if (err?.code === 11000) return json({ error: "email_taken" }, 409);
      throw err;
    }

    await logAudit({
      request,
      actor: g.session.user,
      action: "career.account_created",
      targetId: String(created._id),
      targetEmail: created.email,
    });
    return json(
      serializeCareerAccount(created, {
        applications: 0, pendingApplications: 0, activeJobs: 0, completedJobs: 0, pendingPay: 0, certificationsCompleted: 0,
      }),
      201
    );
  } catch (err) {
    console.error("[admin/career-accounts] POST error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
