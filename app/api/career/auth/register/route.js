// app/api/career/auth/register/route.js — إنشاء حساب كارير جديد (+ دخول تلقائي).
// CAREER_REGISTRATION_ENABLED=false في الـ env = قفل التسجيل.
import bcrypt from "bcryptjs";
import { connectToMongo } from "../../../../lib/mongodb";
import { getCareerAccountModel, createCareerSession, careerJson } from "../../../../lib/careerAuth";
import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";
import { logAudit } from "../../../../lib/auditLog";

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_SECONDS = 60 * 60;
const LIMITS = { name: 100, email: 254, phone: 20, password: 128 };

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^\+?[0-9\s-]{7,20}$/.test(v);

export async function POST(request) {
  try {
    if (process.env.CAREER_REGISTRATION_ENABLED === "false") {
      return careerJson({ error: "registration_disabled" }, 403);
    }

    const ip = getClientIp(request);
    const rl = await checkRateLimit(`career:register:ip:${ip}`, {
      limit: REGISTER_LIMIT,
      windowSeconds: REGISTER_WINDOW_SECONDS,
    });
    if (!rl.allowed) {
      return careerJson({ error: "too_many_attempts", retryAfterSeconds: rl.retryAfterSeconds }, 429);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return careerJson({ error: "invalid_body" }, 400);
    }
    for (const f of ["name", "email", "phone", "password"]) {
      if (body[f] !== undefined && typeof body[f] !== "string") {
        return careerJson({ error: "invalid_body" }, 400);
      }
    }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const password = body.password || "";

    if (!name || !email || !phone || !password) return careerJson({ error: "missing_fields" }, 400);
    if (
      name.length > LIMITS.name ||
      email.length > LIMITS.email ||
      phone.length > LIMITS.phone ||
      password.length > LIMITS.password
    ) {
      return careerJson({ error: "invalid_body" }, 400);
    }
    if (name.length < 2) return careerJson({ error: "invalid_name" }, 400);
    if (!isValidEmail(email)) return careerJson({ error: "invalid_email" }, 400);
    if (!isValidPhone(phone)) return careerJson({ error: "invalid_phone" }, 400);
    if (password.length < 8) return careerJson({ error: "weak_password" }, 400);

    await connectToMongo();
    const Account = getCareerAccountModel();

    if (await Account.exists({ email })) return careerJson({ error: "email_taken" }, 409);

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
      if (err?.code === 11000) return careerJson({ error: "email_taken" }, 409);
      throw err;
    }

    await createCareerSession(created);
    await logAudit({
      request,
      actor: { id: created._id, email: created.email, name: created.name },
      action: "career.register",
    });

    return careerJson({ ok: true, name: created.name }, 201);
  } catch (err) {
    console.error("[career-register] error:", err);
    return careerJson({ error: "internal_error" }, 500);
  }
}
