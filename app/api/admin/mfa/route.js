// app/api/admin/mfa/route.js
//
// تفعيل/تعطيل MFA (TOTP) لحساب الأدمن الحالي من لوحة الأدمن نفسها (بدل
// scripts/setup-mfa.mjs). كلهم POST على نفس الـ URL والفرق في حقل "action":
//   { "action": "setup" }                         → secret + QR (لسه من غير تفعيل)
//   { "action": "verify-setup", "code": "123456" } → تأكيد الكود + تفعيل + أكواد احتياطية
//   { "action": "disable", "code": "123456" }      → تعطيل (كود TOTP أو كود احتياطي)
//
// الحماية: admin-only، rate limit صارم على أفعال التحقق من الكود، وأي
// تفعيل/تعطيل بيزوّد tokenVersion (الجلسات المفتوحة بتتبطل خلال ~60 ثانية)
// وبيتسجّل في audit_logs.

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { Secret } from "otpauth";
import QRCode from "qrcode";
import { connectToMongo, getAuthModel } from "../../../lib/mongodb";
import { logAudit } from "../../../lib/auditLog";
import { requireRole } from "../../../lib/rbac";
import { enforceRateLimit } from "../../../lib/rateLimit";
import { buildTotp, verifyTotpCode, verifyBackupCode } from "../../../lib/authSecurity";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// 8 أكواد بنفس شكل scripts/setup-mfa.mjs (XXXXXXXX-XXXXXXXX من hex عشوائي قوي).
function generateBackupCodes(count = 8) {
  return Array.from({ length: count }, () => {
    const a = randomBytes(4).toString("hex").toUpperCase();
    const b = randomBytes(4).toString("hex").toUpperCase();
    return `${a}-${b}`;
  });
}

const labelFor = (user) => user.email || user.name || "admin";

// خطوة 1 من 2: توليد secret + QR. mfaEnabled لسه false — التفعيل الفعلي في
// verify-setup بعد ما الأدمن يثبت إنه قدر يولّد كود صح من التطبيق.
async function handleSetup({ user }) {
  if (user.mfaEnabled) return json({ error: "mfa_already_enabled" }, 400);

  const secret = new Secret({ size: 20 });
  user.mfaSecret = secret.base32;
  await user.save();

  const otpauthUrl = buildTotp(secret.base32, labelFor(user)).toString();
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return json({ secret: secret.base32, otpauthUrl, qrDataUrl });
}

// خطوة 2 من 2: تأكيد الكود → تفعيل + أكواد احتياطية (بتتعرض مرة واحدة بس هنا،
// ومتخزّن منها الـ hash فقط).
async function handleVerifySetup({ request, session, user, code }) {
  if (!code) return json({ error: "missing_code" }, 400);
  if (!user.mfaSecret) return json({ error: "setup_not_started" }, 400);
  if (user.mfaEnabled) return json({ error: "mfa_already_enabled" }, 400);

  if (!verifyTotpCode(user.mfaSecret, code)) return json({ error: "invalid_code" }, 400);

  const backupCodes = generateBackupCodes();
  user.mfaBackupCodeHashes = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, 10)));
  user.mfaEnabled = true;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  await logAudit({
    request,
    actor: session.user,
    action: "admin.mfa_enabled",
    targetId: user._id.toString(),
    targetEmail: user.email || null,
  });

  return json({ message: "MFA enabled successfully", backupCodes });
}

// التعطيل لازم كود صحيح (TOTP أو احتياطي) — مش مجرد جلسة مفتوحة — عشان جلسة
// مسروقة من غير موبايل الأدمن ماتقدرش تفصل الحماية.
async function handleDisable({ request, session, user, code }) {
  if (!code) return json({ error: "missing_code" }, 400);
  if (!user.mfaEnabled) return json({ error: "mfa_not_enabled" }, 400);

  const valid = verifyTotpCode(user.mfaSecret, code) || (await verifyBackupCode(user, code));
  if (!valid) return json({ error: "invalid_code" }, 400);

  user.mfaEnabled = false;
  user.mfaSecret = null;
  user.mfaBackupCodeHashes = [];
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  await logAudit({
    request,
    actor: session.user,
    action: "admin.mfa_disabled",
    targetId: user._id.toString(),
    targetEmail: user.email || null,
  });

  return json({ message: "MFA disabled" });
}

export async function POST(request) {
  try {
    const auth = await requireRole(["admin"]);
    if (auth.response) return auth.response;
    const { session } = auth;

    const body = await request.json().catch(() => null);
    const action = body?.action;
    const code = body?.code ? String(body.code).trim() : "";

    // verify-setup/disable بيتحققوا من كود قصير → حد صارم: 5 محاولات كل 5 دقايق
    // لكل أدمن. setup (مجرد QR) حدها أوسع.
    const isCodeCheck = action === "verify-setup" || action === "disable";
    const rl = await enforceRateLimit(request, {
      keyPrefix: `admin:mfa:${action || "unknown"}`,
      limit: isCodeCheck ? 5 : 10,
      windowSeconds: isCodeCheck ? 300 : 60,
      extraKey: `user:${session.user.id}`,
    });
    if (rl) return rl;

    await connectToMongo();
    const user = await getAuthModel().findById(session.user.id);
    if (!user) return json({ error: "not_found" }, 404);

    switch (action) {
      case "setup":
        return await handleSetup({ user });
      case "verify-setup":
        return await handleVerifySetup({ request, session, user, code });
      case "disable":
        return await handleDisable({ request, session, user, code });
      default:
        return json({ error: "invalid_action" }, 400);
    }
  } catch (err) {
    console.error("[/api/admin/mfa] POST error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
