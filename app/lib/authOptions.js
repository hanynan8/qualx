// app/lib/authOptions.js
//
// إعدادات NextAuth. الملف ده مستورد من:
//   - app/api/auth/[...nextauth]/route.js  (NextAuth(authOptions))
//   - app/lib/rbac.js, app/api/data/route.js, app/layout.jsx (getServerSession)
//
// 🔒 طبقات الحماية:
//  1) Rate limit على مستوى الـ IP (lib/rateLimit.js — Redis لو متظبط، وإلا ذاكرة).
//  2) قفل الحساب نفسه بعد 5 محاولات فاشلة (15 دقيقة) — محفوظ في الداتابيز.
//  3) رسايل خطأ موحّدة: حساب مش موجود = باسورد غلط (نفس الشكل ونفس التوقيت تقريبًا).
//  4) الحساب الموقوف (status = "suspended") مايدخلش حتى بباسورد صح.
//  5) MFA (TOTP) إجباري لأي admin مفعّل عنده MFA (scripts/setup-mfa.mjs).
//  6) الـ role حصريًا من الداتابيز — مفيش أي مقارنة إيميل في الكود.
//  7) إبطال الجلسة فورًا (~60 ثانية) لو الباسورد/الـ role اتغير أو الحساب اتوقف،
//     عن طريق tokenVersion.
//  8) الباسوردات القديمة plain-text بتترقّى تلقائيًا لـ bcrypt أول ما صاحبها يدخل.
//  9) كل حدث أمني مهم بيتسجل في audit_logs.

import CredentialsProvider from "next-auth/providers/credentials";
import { decode as defaultDecode } from "next-auth/jwt";
import { connectToMongo, getAuthModel } from "./mongodb";
import { checkRateLimit, getClientIp } from "./rateLimit";
import { logAudit } from "./auditLog";
import {
  MAX_IDENTIFIER_LENGTH,
  MAX_PASSWORD_LENGTH,
  verifyPassword,
  burnPasswordCheck,
  isAccountLocked,
  lockRemainingSeconds,
  registerFailedAttempt,
  clearLoginLock,
  verifyTotpCode,
  verifyBackupCode,
} from "./authSecurity";

// حد الـ IP: 10 محاولات كل 15 دقيقة. (أعلى من Edumaster عمدًا: شركة فيها
// موظفين ورا نفس الـ IP/الراوتر، والقفل الأساسي على مستوى الحساب أصلًا.)
const IP_LIMIT = 10;
const IP_WINDOW_SECONDS = 15 * 60;

// رسايل الأخطاء المقصودة اللي بتوصل للواجهة زي ما هي (login/page.jsx بيفسّرها).
// أي خطأ تاني (عطل داتابيز مثلًا) بيتحول لـ null = "بيانات غلط" عامة، من غير
// ما نسرّب تفاصيل داخلية.
const KNOWN_ERROR_PREFIXES = [
  "rate_limited:",
  "account_locked:",
  "account_suspended",
  "invalid_credentials:",
  "mfa_required",
  "mfa_invalid:",
];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        nameOrEmail: { label: "Name or Email", type: "text" },
        password: { label: "Password", type: "password" },
        mfaCode: { label: "MFA Code", type: "text" },
      },

      async authorize(credentials, req) {
        if (!credentials?.nameOrEmail || !credentials?.password) return null;
        if (
          typeof credentials.nameOrEmail !== "string" ||
          typeof credentials.password !== "string" ||
          credentials.nameOrEmail.length > MAX_IDENTIFIER_LENGTH ||
          credentials.password.length > MAX_PASSWORD_LENGTH
        ) {
          return null;
        }

        const ip = getClientIp(req);

        // أول خط دفاع: قبل أي استعلام للداتابيز.
        const ipCheck = await checkRateLimit(`login:ip:${ip}`, {
          limit: IP_LIMIT,
          windowSeconds: IP_WINDOW_SECONDS,
        });
        if (!ipCheck.allowed) {
          throw new Error(`rate_limited:${ipCheck.retryAfterSeconds}`);
        }

        try {
          await connectToMongo();
          const AuthModel = getAuthModel();

          const identifier = credentials.nameOrEmail.toLowerCase().trim();
          // لو فيه "@" يبقى إيميل (مطابقة تامة، عليها unique index)، وإلا اسم
          // (نمط ^...$ بعد escape كامل). الفصل ده بيمنع أي لبس بين حسابين لو
          // حد سجّل اسم شبه إيميل حد تاني — والتسجيل أصلًا بيرفض أسماء فيها "@".
          // مفيش أي قيمة من المستخدم بتدخل الاستعلام كـ operator.
          const query = identifier.includes("@")
            ? { email: identifier }
            : { name: new RegExp(`^${escapeRegex(identifier)}$`, "i") };
          const userDoc = await AuthModel.findOne(query);

          // حساب مش موجود: نفس شكل "باسورد غلط" ونفس تكلفة الوقت تقريبًا.
          if (!userDoc) {
            await burnPasswordCheck(credentials.password);
            throw new Error(`invalid_credentials:${ipCheck.remaining}`);
          }

          if (userDoc.status === "suspended") {
            throw new Error("account_suspended");
          }

          // مقفول مؤقتًا: نرفض من غير ما نفحص الباسورد (يمنع التخمين وقت القفل).
          if (isAccountLocked(userDoc)) {
            throw new Error(`account_locked:${lockRemainingSeconds(userDoc)}`);
          }

          const { valid, upgradeTo } = await verifyPassword(
            credentials.password,
            userDoc.password
          );

          if (!valid) {
            const attempt = await registerFailedAttempt(userDoc);
            if (attempt.locked) {
              await logAudit({
                request: req,
                actor: { id: userDoc._id, email: userDoc.email, name: userDoc.name },
                action: "auth.account_locked",
                details: { reason: "password" },
              });
              throw new Error(`account_locked:${attempt.lockSeconds}`);
            }
            throw new Error(
              `invalid_credentials:${Math.min(attempt.remaining, ipCheck.remaining)}`
            );
          }

          if (upgradeTo) userDoc.password = upgradeTo;

          const role = userDoc.role || "user";

          // MFA إجباري لأي admin مفعّل عنده MFA. الباسورد صح، بس مش كفاية.
          if (role === "admin" && userDoc.mfaEnabled) {
            const code = credentials.mfaCode ? String(credentials.mfaCode).trim() : "";
            if (!code) throw new Error("mfa_required");

            const totpValid = verifyTotpCode(userDoc.mfaSecret, code);
            const backupValid = !totpValid && (await verifyBackupCode(userDoc, code));

            if (!totpValid && !backupValid) {
              const attempt = await registerFailedAttempt(userDoc);
              await logAudit({
                request: req,
                actor: { id: userDoc._id, email: userDoc.email, name: userDoc.name },
                action: attempt.locked ? "auth.account_locked" : "auth.mfa_failed",
                details: { reason: "mfa" },
              });
              if (attempt.locked) throw new Error(`account_locked:${attempt.lockSeconds}`);
              throw new Error(
                `mfa_invalid:${Math.min(attempt.remaining, ipCheck.remaining)}`
              );
            }
          }

          // نجح الدخول: نصفّر القفل ونحفظ (ترقية الباسورد/استهلاك كود احتياطي) مرة واحدة.
          clearLoginLock(userDoc);
          await userDoc.save();

          await logAudit({
            request: req,
            actor: { id: userDoc._id, email: userDoc.email, name: userDoc.name },
            action: "auth.login_success",
            details: { role },
          });

          return {
            id: userDoc._id.toString(),
            name: userDoc.name || null,
            email: userDoc.email || null,
            role,
            tokenVersion: userDoc.tokenVersion || 0,
          };
        } catch (error) {
          if (
            typeof error?.message === "string" &&
            KNOWN_ERROR_PREFIXES.some((p) => error.message.startsWith(p))
          ) {
            throw error;
          }
          console.error("[auth] authorize error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,

  // 🐛 JWEDecryptionFailed: كوكي الجلسة القديم (اتعمل بـ NEXTAUTH_SECRET مختلف،
  // أو من مشروع تاني على نفس localhost:3000) مينفعش يتفك. بدل ما كل request
  // يطلّع stack trace ضخم ويكسر الـ layout، بنعتبر الجلسة دي "مفيش جلسة" (null)
  // والمستخدم ببساطة يسجّل دخول من جديد.
  jwt: {
    async decode(params) {
      try {
        return await defaultDecode(params);
      } catch {
        return null;
      }
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      // أول مرة بعد تسجيل الدخول.
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.tokenVersion = user.tokenVersion ?? 0;
        token.lastValidated = Date.now();
        token.invalid = false;
        return token;
      }

      // إعادة تحقق من الداتابيز مرة كل 60 ثانية بالكتير (مش على كل request):
      // الحساب اتوقف؟ اتحذف؟ tokenVersion اتغير (تغيير باسورد/إبطال جلسات)؟
      // الـ role اتغير؟ → أقصى نافذة تعرّض لجلسة مسروقة ~60 ثانية بدل 7 أيام.
      const now = Date.now();
      const stale = !token.lastValidated || now - token.lastValidated > 60 * 1000;

      if (stale && token.id) {
        try {
          await connectToMongo();
          const AuthModel = getAuthModel();
          const dbUser = await AuthModel.findById(
            token.id,
            "tokenVersion role status name"
          ).lean();

          if (
            !dbUser ||
            dbUser.status === "suspended" ||
            (dbUser.tokenVersion ?? 0) !== (token.tokenVersion ?? 0)
          ) {
            token.invalid = true;
          } else {
            token.invalid = false;
            token.role = dbUser.role || "user";
            token.name = dbUser.name ?? token.name;
            token.lastValidated = now;
          }
        } catch (err) {
          // عطل مؤقت في الداتابيز مايسجّلش خروج الكل (fail-open على الأعطال
          // العابرة بس)، لكن بيتسجل.
          console.error("[auth] JWT revalidation error:", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // الجلسة اتبطلت → null = المستخدم يعتبر مسجّل خروج فورًا.
      if (token?.invalid) return null;

      if (token && session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/") && !url.startsWith("//")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // url مش صالح — نرجع للرئيسية.
      }
      return baseUrl;
    },
  },

  // الـ debug مقفول افتراضيًا (كان بيطبع DEBUG_ENABLED + stack traces على كل طلب).
  // لو عايزه: NEXTAUTH_DEBUG=true في .env.local
  debug: process.env.NEXTAUTH_DEBUG === "true",
};

if (!authOptions.secret && process.env.NODE_ENV !== "production") {
  console.warn(
    "[auth] NEXTAUTH_SECRET مش متظبط في .env.local — الجلسات مش هتفضل شغالة بعد إعادة التشغيل."
  );
}

export default authOptions;