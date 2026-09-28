// app/lib/mongodb.js
//
// ❌ المشكلة اللي كانت موجودة: app/api/data/route.js بيعمل
//    import { connectToMongo } from "@/app/lib/mongodb";
// لكن الملف ده مكانش موجود في الريبو أصلًا — يعني أي طلب لـ /api/data كان
// هيفشل فورًا بـ "Module not found: Can't resolve '@/app/lib/mongodb'"
// وقت الـ build/dev، قبل ما نوصل حتى لأي كود أمان جوه الراوت.
//
// ده standard pattern لـ Next.js + Mongoose: بنعمل cache للاتصال (والـ
// promise بتاعه) على globalThis عشان في serverless/dev مع Hot Reload
// منفتحش أكتر من اتصال واحد بالغلط مع كل إعادة تحميل للموديول.
import mongoose from "mongoose";

// نفس اسم المتغير اللي بيستخدمه scripts/seed.mjs بالظبط (MONGODB_URI مع
// fallback على MONGO_URI) عشان الاتنين يتكلموا مع نفس الداتابيز من غير
// لخبطة في أسماء متغيرات البيئة.
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI (or MONGO_URI) environment variable. Set it in .env.local locally, or in your hosting provider's environment variables in production."
  );
}

let cached = globalThis._mongooseConnection;
if (!cached) {
  cached = globalThis._mongooseConnection = { conn: null, promise: null };
}

export async function connectToMongo() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // 🔒 لو الاتصال فشل (URI غلط، الداتابيز واقعة، إلخ)، امسح الـ promise
    // المخزّنة عشان الطلب اللي بعده يعيد المحاولة بدل ما يفضل عالق على
    // نفس الوعد المرفوض.
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectToMongo;

// ─────────────────────────────────────────────────────────────────────
// 🔐 موديل المستخدمين (كولكشن "auth") + سجل التدقيق (كولكشن "audit_logs")
//
// الحقول معرّفة صراحةً عشان userDoc.save() يحفظها فعلاً (Mongoose بيتجاهل
// أي property مش موجودة في الـ schema). strict:false سايبينه عشان أي حقول
// قديمة في الحسابات الموجودة عندك تفضل شغالة زي ما هي.
//
// ⚠️ الموديل ده مخصص لكود السيرفر الموثوق بس (authOptions, scripts, rbac).
// كولكشن "auth" و "audit_logs" ممنوعين تمامًا من /api/data العام.
// ─────────────────────────────────────────────────────────────────────
export const USER_ROLES = ["admin", "user"];

const authSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, lowercase: true, trim: true },
    password: String,
    phone: String,
    role: { type: String, default: "user" },

    // "active" عادي، "suspended" = موقوف يدويًا من الأدمن (بيتفحص قبل الباسورد).
    status: { type: String, enum: ["active", "suspended"], default: "active" },

    // إبطال الجلسات: أي زيادة في الرقم ده = كل الجلسات القديمة تتبطل.
    tokenVersion: { type: Number, default: 0 },
    passwordChangedAt: { type: Date, default: null },

    // قفل الحساب المؤقت بعد محاولات فاشلة متكررة.
    loginFailedAttempts: { type: Number, default: 0 },
    loginFirstFailedAt: { type: Date, default: null },
    loginLockedUntil: { type: Date, default: null },

    // MFA (TOTP) — بيتفعّل بـ scripts/setup-mfa.mjs.
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null },
    mfaBackupCodeHashes: { type: [String], default: [] },
  },
  { strict: false, timestamps: true }
);

// unique + sparse: إيميل واحد لكل حساب، ومايمنعش حسابات قديمة من غير إيميل.
authSchema.index({ email: 1 }, { unique: true, sparse: true });
authSchema.index({ name: 1 });

export function getAuthModel() {
  return mongoose.models.Model_auth || mongoose.model("Model_auth", authSchema, "auth");
}

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    actorId: { type: String, default: null },
    actorEmail: { type: String, default: null },
    actorName: { type: String, default: null },
    targetId: { type: String, default: null },
    targetEmail: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
auditLogSchema.index({ createdAt: -1 });

export function getAuditLogModel() {
  return (
    mongoose.models.Model_audit_log ||
    mongoose.model("Model_audit_log", auditLogSchema, "audit_logs")
  );
}
