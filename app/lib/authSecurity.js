// app/lib/authSecurity.js
//
// دوال الأمان المستخدمة في تسجيل الدخول، متفصلة عن authOptions.js عشان
// تكون صغيرة وواضحة وقابلة للاختبار لوحدها:
//   - قفل الحساب المؤقت بعد محاولات فاشلة متكررة
//   - التحقق من الباسورد (bcrypt + توافق مؤقت مع الباسوردات القديمة plain-text)
//   - TOTP (MFA) والأكواد الاحتياطية

import bcrypt from "bcryptjs";
import { TOTP, Secret } from "otpauth";
import { createHash, timingSafeEqual } from "node:crypto";

// 5 محاولات فاشلة خلال 15 دقيقة → قفل الحساب 15 دقيقة.
export const ACCOUNT_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
export const ACCOUNT_MAX_ATTEMPTS = 5;
export const ACCOUNT_LOCK_MS = 15 * 60 * 1000;

// حدود مدخلات لمنع طلبات ضخمة تستهلك CPU (bcrypt) أو ذاكرة.
export const MAX_IDENTIFIER_LENGTH = 254;
export const MAX_PASSWORD_LENGTH = 128;

// hash حقيقي لباسورد عشوائي مش بيتطابق مع أي حاجة. بنعمل عليه bcrypt.compare
// لما الحساب مش موجود، عشان وقت الرد يفضل قريب من حالة "الحساب موجود
// والباسورد غلط" — وإلا المهاجم يقدر يعرف الحسابات الموجودة من فرق التوقيت.
const DUMMY_HASH = "$2b$12$/lUyqEzekKtiOvlHSnQunuGkHDt7CpHL/LvyOw/.z0ghXDqIxqT2i";

export async function burnPasswordCheck(password) {
  await bcrypt.compare(String(password || ""), DUMMY_HASH);
}

export function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$/.test(value);
}

// مقارنة plain-text بزمن ثابت (للباسوردات القديمة بس). بنعمل sha256 للطرفين
// الأول عشان الطولين يتساووا (timingSafeEqual بيرمي error لو الأطوال مختلفة).
function safeEqual(a, b) {
  const ha = createHash("sha256").update(String(a)).digest();
  const hb = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * @returns {Promise<{valid:boolean, upgradeTo:(string|null)}>}
 * upgradeTo: لو الباسورد المخزّن كان plain-text وطابق، بنرجّع hash bcrypt
 * جديد عشان يتحفظ مكانه (ترقية تلقائية — محدش يفضل plain-text في الداتابيز).
 */
export async function verifyPassword(input, stored) {
  const password = String(input || "");
  if (!password || password.length > MAX_PASSWORD_LENGTH) {
    await burnPasswordCheck(password.slice(0, MAX_PASSWORD_LENGTH));
    return { valid: false, upgradeTo: null };
  }
  if (isBcryptHash(stored)) {
    return { valid: await bcrypt.compare(password, stored), upgradeTo: null };
  }
  if (typeof stored === "string" && stored.length > 0 && safeEqual(password, stored)) {
    return { valid: true, upgradeTo: await bcrypt.hash(password, 12) };
  }
  await burnPasswordCheck(password);
  return { valid: false, upgradeTo: null };
}

// ───────────────────────── قفل الحساب ─────────────────────────

function ensureLoginWindow(userDoc) {
  const now = Date.now();
  const first = userDoc.loginFirstFailedAt ? new Date(userDoc.loginFirstFailedAt).getTime() : null;
  if (!first || now - first > ACCOUNT_ATTEMPT_WINDOW_MS) {
    userDoc.loginFirstFailedAt = new Date(now);
    userDoc.loginFailedAttempts = 0;
  }
}

export function isAccountLocked(userDoc) {
  return !!(userDoc.loginLockedUntil && new Date(userDoc.loginLockedUntil) > new Date());
}

export function lockRemainingSeconds(userDoc) {
  if (!userDoc.loginLockedUntil) return 0;
  const ms = new Date(userDoc.loginLockedUntil).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 1000));
}

export async function registerFailedAttempt(userDoc) {
  ensureLoginWindow(userDoc);
  userDoc.loginFailedAttempts = (userDoc.loginFailedAttempts || 0) + 1;

  const locked = userDoc.loginFailedAttempts >= ACCOUNT_MAX_ATTEMPTS;
  if (locked) userDoc.loginLockedUntil = new Date(Date.now() + ACCOUNT_LOCK_MS);
  await userDoc.save();

  return {
    locked,
    remaining: Math.max(0, ACCOUNT_MAX_ATTEMPTS - userDoc.loginFailedAttempts),
    lockSeconds: Math.ceil(ACCOUNT_LOCK_MS / 1000),
  };
}

export function clearLoginLock(userDoc) {
  userDoc.loginFailedAttempts = 0;
  userDoc.loginFirstFailedAt = null;
  userDoc.loginLockedUntil = null;
}

// ───────────────────────── MFA (TOTP) ─────────────────────────

const TOTP_OPTS = { digits: 6, period: 30, algorithm: "SHA1" };

// window:1 = بيقبل الكود الحالي والسابق والتالي (±30 ثانية) لفروق ساعة الموبايل.
export function verifyTotpCode(base32Secret, code) {
  if (!base32Secret || !code) return false;
  try {
    const totp = new TOTP({ ...TOTP_OPTS, secret: Secret.fromBase32(base32Secret) });
    return totp.validate({ token: String(code).trim(), window: 1 }) !== null;
  } catch (err) {
    console.error("TOTP verification error:", err);
    return false;
  }
}

// الكود الاحتياطي بيتستهلك مرة واحدة (بيتشال من المصفوفة — الحفظ على المُنادي).
export async function verifyBackupCode(userDoc, code) {
  const hashes = userDoc.mfaBackupCodeHashes;
  if (!code || !Array.isArray(hashes) || hashes.length === 0) return false;
  const normalized = String(code).trim().toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(normalized, hashes[i])) {
      hashes.splice(i, 1);
      if (typeof userDoc.markModified === "function") userDoc.markModified("mfaBackupCodeHashes");
      return true;
    }
  }
  return false;
}

export function buildTotp(base32Secret, label, issuer = "Qualx") {
  return new TOTP({ ...TOTP_OPTS, issuer, label, secret: Secret.fromBase32(base32Secret) });
}
