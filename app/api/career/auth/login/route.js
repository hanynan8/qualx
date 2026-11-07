// app/api/career/auth/login/route.js — دخول داشبورد الكارير (إيميل + باسورد).
import { connectToMongo } from "../../../../lib/mongodb";
import { getCareerAccountModel, createCareerSession, careerJson } from "../../../../lib/careerAuth";
import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";
import { logAudit } from "../../../../lib/auditLog";
import {
  MAX_IDENTIFIER_LENGTH,
  MAX_PASSWORD_LENGTH,
  verifyPassword,
  burnPasswordCheck,
  isAccountLocked,
  lockRemainingSeconds,
  registerFailedAttempt,
  clearLoginLock,
} from "../../../../lib/authSecurity";

// قابل للضبط من الـ env. الافتراضي 10 محاولات/15 دقيقة لكل IP.
const IP_LIMIT = Number(process.env.CAREER_LOGIN_IP_LIMIT) || 10;
const IP_WINDOW_SECONDS = 15 * 60;

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const ipCheck = await checkRateLimit(`career:login:ip:${ip}`, {
      limit: IP_LIMIT,
      windowSeconds: IP_WINDOW_SECONDS,
    });
    if (!ipCheck.allowed) {
      return careerJson({ error: "rate_limited", retryAfterSeconds: ipCheck.retryAfterSeconds }, 429);
    }

    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      !body.email ||
      !body.password ||
      body.email.length > MAX_IDENTIFIER_LENGTH ||
      body.password.length > MAX_PASSWORD_LENGTH
    ) {
      return careerJson({ error: "invalid_body" }, 400);
    }

    await connectToMongo();
    const Account = getCareerAccountModel();
    const email = body.email.toLowerCase().trim();
    const doc = await Account.findOne({ email });

    // حساب مش موجود: نفس رد "باسورد غلط" ونفس تكلفة الوقت تقريبًا.
    if (!doc) {
      await burnPasswordCheck(body.password);
      return careerJson({ error: "invalid_credentials", remaining: ipCheck.remaining }, 401);
    }
    if (doc.status === "suspended") return careerJson({ error: "account_suspended" }, 403);
    if (isAccountLocked(doc)) {
      return careerJson({ error: "account_locked", retryAfterSeconds: lockRemainingSeconds(doc) }, 423);
    }

    const { valid } = await verifyPassword(body.password, doc.password);
    if (!valid) {
      const attempt = await registerFailedAttempt(doc);
      if (attempt.locked) {
        await logAudit({
          request,
          actor: { id: doc._id, email: doc.email, name: doc.name },
          action: "career.account_locked",
        });
        return careerJson({ error: "account_locked", retryAfterSeconds: attempt.lockSeconds }, 423);
      }
      return careerJson(
        { error: "invalid_credentials", remaining: Math.min(attempt.remaining, ipCheck.remaining) },
        401
      );
    }

    clearLoginLock(doc);
    await doc.save();
    await createCareerSession(doc);
    await logAudit({
      request,
      actor: { id: doc._id, email: doc.email, name: doc.name },
      action: "career.login_success",
    });

    return careerJson({ ok: true, name: doc.name });
  } catch (err) {
    console.error("[career-login] error:", err);
    return careerJson({ error: "internal_error" }, 500);
  }
}
