// app/api/register/route.js
//
// نقطة إنشاء حساب جديد (زي Edumaster). الحساب الجديد دايمًا role="user" و
// status="active" — مفيش أي طريقة للعميل إنه يطلب صلاحية أعلى. الأدمن بيتعمل
// بـ scripts/make-admin.mjs بس.
//
// 🔒 التحصينات:
//  - Rate limit لكل IP (5 تسجيلات / ساعة).
//  - كل الحقول لازم تكون strings بأطوال محدودة (منع objects/NoSQL injection).
//  - الحقول بتتنسخ واحد واحد للـ create (مفيش spread للـ body = مفيش mass-assignment).
//  - الاسم ممنوع يحتوي على "@" (عشان ماحدش يسجّل اسم شبه إيميل حد تاني —
//    تسجيل الدخول بيفرّق بين الإيميل والاسم على أساس وجود "@").
//  - unique index على email + التعامل مع race condition (E11000).
//  - REGISTRATION_ENABLED=false في الـ env = قفل التسجيل العام بالكامل.

import bcrypt from "bcryptjs";
import { connectToMongo, getAuthModel } from "../../lib/mongodb";
import { checkRateLimit, getClientIp } from "../../lib/rateLimit";
import { logAudit } from "../../lib/auditLog";

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_SECONDS = 60 * 60;

const LIMITS = { name: 100, email: 254, phone: 20, password: 128 };

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^\+?[0-9\s-]{7,20}$/.test(v);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function POST(request) {
  try {
    if (process.env.REGISTRATION_ENABLED === "false") {
      return jsonResponse({ error: "registration_disabled" }, 403);
    }

    const ip = getClientIp(request);
    const { allowed, retryAfterSeconds } = await checkRateLimit(`register:ip:${ip}`, {
      limit: REGISTER_LIMIT,
      windowSeconds: REGISTER_WINDOW_SECONDS,
    });
    if (!allowed) return jsonResponse({ error: "too_many_attempts", retryAfterSeconds }, 429);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ error: "invalid_body" }, 400);
    }

    // كل الحقول لازم strings (لو object أو array → رفض، مش تحويل لنص).
    for (const f of ["name", "email", "phone", "password"]) {
      if (body[f] !== undefined && typeof body[f] !== "string") {
        return jsonResponse({ error: "invalid_body" }, 400);
      }
    }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const password = body.password || "";

    if (!name || !email || !phone || !password) {
      return jsonResponse({ error: "missing_fields" }, 400);
    }
    if (
      name.length > LIMITS.name ||
      email.length > LIMITS.email ||
      phone.length > LIMITS.phone ||
      password.length > LIMITS.password
    ) {
      return jsonResponse({ error: "invalid_body" }, 400);
    }
    if (name.length < 2 || name.includes("@")) return jsonResponse({ error: "invalid_name" }, 400);
    if (!isValidEmail(email)) return jsonResponse({ error: "invalid_email" }, 400);
    if (!isValidPhone(phone)) return jsonResponse({ error: "invalid_phone" }, 400);
    if (password.length < 8) return jsonResponse({ error: "weak_password" }, 400);

    await connectToMongo();
    const AuthModel = getAuthModel();

    const existing = await AuthModel.findOne(
      { $or: [{ email }, { name: new RegExp(`^${escapeRegex(name)}$`, "i") }] },
      "name email"
    ).lean();

    if (existing) {
      // الإيميل الأول (المعرّف الفريد الحقيقي).
      if (existing.email?.toLowerCase().trim() === email) {
        return jsonResponse({ error: "email_taken" }, 409);
      }
      return jsonResponse({ error: "name_taken" }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let created;
    try {
      created = await AuthModel.create({
        name,
        email,
        phone,
        password: passwordHash,
        role: "user",
        status: "active",
        tokenVersion: 0,
        passwordChangedAt: new Date(),
      });
    } catch (err) {
      // سباق: طلبين بنفس الإيميل في نفس اللحظة — الـ unique index هو اللي بيحسم.
      if (err?.code === 11000) return jsonResponse({ error: "email_taken" }, 409);
      throw err;
    }

    await logAudit({
      request,
      actor: { id: created._id, email: created.email, name: created.name },
      action: "auth.register",
    });

    return jsonResponse(
      { id: created._id.toString(), name: created.name, email: created.email },
      201
    );
  } catch (err) {
    console.error("[register] error:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
}
