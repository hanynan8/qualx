// app/lib/careerAuth.js
//
// نظام دخول مستقل تمامًا لداشبورد الكارير (/career-dashboard) — منفصل عن حسابات
// الموقع/الأدمن (NextAuth):
//   - كولكشن خاص: "career_accounts" (مش "auth").
//   - كوكي خاص: "career_session" (JWT موقّع بـ salt مختلف، فمستحيل كوكي الأدمن
//     يتقبل هنا ولا العكس).
//   - حساب الكارير مايدخلش /admin ولا /dashboard، والعكس صحيح.
// بيستخدم نفس طبقات الحماية الموجودة (bcrypt، قفل الحساب، rate limit) من authSecurity.js.

import mongoose from "mongoose";
import { cookies } from "next/headers";
import { encode, decode } from "next-auth/jwt";
import { connectToMongo } from "./mongodb";

export const CAREER_COOKIE = "career_session";
export const CAREER_DASHBOARD_PATH = "/career-dashboard";
export const CAREER_LOGIN_PATH = "/career-dashboard/login";
const CAREER_SALT = "career-dashboard-session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const careerAccountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },
    status: { type: String, enum: ["active", "suspended"], default: "active" },

    // إبطال الجلسات: أي زيادة = كل الجلسات القديمة تتبطل.
    tokenVersion: { type: Number, default: 0 },
    passwordChangedAt: { type: Date, default: null },

    // قفل الحساب المؤقت بعد محاولات فاشلة (نفس حقول authSecurity.js).
    loginFailedAttempts: { type: Number, default: 0 },
    loginFirstFailedAt: { type: Date, default: null },
    loginLockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);
careerAccountSchema.index({ email: 1 }, { unique: true });

export function getCareerAccountModel() {
  return (
    mongoose.models.Model_career_account ||
    mongoose.model("Model_career_account", careerAccountSchema, "career_accounts")
  );
}

function secret() {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
}

export async function createCareerSession(account) {
  const token = await encode({
    token: {
      id: String(account._id),
      tokenVersion: account.tokenVersion || 0,
      kind: "career",
    },
    secret: secret(),
    salt: CAREER_SALT,
    maxAge: MAX_AGE_SECONDS,
  });
  const jar = await cookies();
  jar.set(CAREER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearCareerSession() {
  const jar = await cookies();
  jar.set(CAREER_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

/**
 * بيرجّع حساب الكارير الحالي (أو null). بيتحقق من الداتابيز في كل مرة:
 * الحساب اتوقف/اتحذف/tokenVersion اتغير = الجلسة باطلة فورًا.
 */
export async function getCareerUser() {
  try {
    const jar = await cookies();
    const raw = jar.get(CAREER_COOKIE)?.value;
    if (!raw) return null;

    const token = await decode({ token: raw, secret: secret(), salt: CAREER_SALT });
    if (!token || token.kind !== "career" || !token.id) return null;

    await connectToMongo();
    const doc = await getCareerAccountModel()
      .findById(token.id, "name email phone status tokenVersion createdAt")
      .lean();
    if (!doc || doc.status === "suspended") return null;
    if ((doc.tokenVersion || 0) !== (token.tokenVersion || 0)) return null;

    return {
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      phone: doc.phone || "",
      createdAt: doc.createdAt,
    };
  } catch {
    return null;
  }
}

export function careerJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// للـ API routes: 401 لو مفيش جلسة كارير.
export async function requireCareer() {
  const user = await getCareerUser();
  if (!user) return { user: null, response: careerJson({ error: "unauthorized" }, 401) };
  return { user, response: null };
}
