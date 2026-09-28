// scripts/setup-mfa.mjs
//
// تفعيل التحقق بخطوتين (TOTP) لحساب أدمن — شغّال مع Google Authenticator /
// Microsoft Authenticator / Authy / 1Password.
//
//   node scripts/setup-mfa.mjs admin@qualx.com            # تفعيل
//   node scripts/setup-mfa.mjs admin@qualx.com --disable  # إلغاء (لو ضاع الموبايل والأكواد الاحتياطية)
//
// التفعيل: بيعرض QR في التيرمينال، وما بيحفظش حاجة إلا بعد ما تدخل كود صحيح
// من التطبيق (عشان ما تقفلش على نفسك بسكرت غلط). بعدها بيطبع 8 أكواد احتياطية
// مرة واحدة بس — احفظهم في مكان آمن. كل كود بيتستخدم مرة واحدة.
// أي تغيير بيزوّد tokenVersion (كل الجلسات المفتوحة للحساب بتتبطل).

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import QRCode from "qrcode";
import { randomBytes } from "node:crypto";
import { Secret, TOTP } from "otpauth";
import { connect, getUserModel, ask, isEmail } from "./_shared.mjs";

function makeBackupCodes(n = 8) {
  // XXXX-XXXX من hex عشوائي قوي (32 bit لكل نص → 64 bit للكود).
  return Array.from({ length: n }, () => {
    const h = randomBytes(4).toString("hex").toUpperCase();
    const h2 = randomBytes(4).toString("hex").toUpperCase();
    return `${h}-${h2}`;
  });
}

async function main() {
  const email = (process.argv[2] || "").toLowerCase().trim();
  const disable = process.argv.includes("--disable");
  if (!isEmail(email)) {
    console.error("الاستخدام: node scripts/setup-mfa.mjs admin@example.com [--disable]");
    process.exit(1);
  }

  await connect();
  const User = getUserModel();
  const user = await User.findOne({ email });
  if (!user) throw new Error(`مفيش حساب بالإيميل ${email}`);
  if (user.role !== "admin") throw new Error("MFA متاح لحسابات الأدمن بس. شغّل make-admin الأول.");

  if (disable) {
    await User.updateOne(
      { _id: user._id },
      {
        $set: { mfaEnabled: false, mfaSecret: null, mfaBackupCodeHashes: [] },
        $inc: { tokenVersion: 1 },
      }
    );
    console.log(`✅ اتلغى MFA للحساب ${email}.`);
    return;
  }

  const base32 = new Secret({ size: 20 }).base32;
  // نفس إعدادات التحقق في app/lib/authSecurity.js (6 أرقام / 30 ثانية / SHA1).
  const totp = new TOTP({
    issuer: "Qualx",
    label: email,
    secret: Secret.fromBase32(base32),
    digits: 6,
    period: 30,
    algorithm: "SHA1",
  });
  const uri = totp.toString();

  console.log("\nامسح الـ QR ده من تطبيق المصادقة:\n");
  console.log(await QRCode.toString(uri, { type: "terminal", small: true }));
  console.log(`أو أدخل المفتاح يدويًا: ${base32}\n`);

  const code = await ask("اكتب الكود الحالي من التطبيق للتأكيد: ");
  if (totp.validate({ token: code, window: 1 }) === null) {
    throw new Error("الكود غلط. ماتحفظش حاجة — جرّب تاني من الأول.");
  }

  const backupCodes = makeBackupCodes();
  const hashes = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, 12)));

  await User.updateOne(
    { _id: user._id },
    {
      $set: { mfaEnabled: true, mfaSecret: base32, mfaBackupCodeHashes: hashes },
      $inc: { tokenVersion: 1 },
    }
  );

  console.log("\n✅ اتفعّل MFA. الأكواد الاحتياطية (بتظهر مرة واحدة بس — احفظها دلوقتي):\n");
  backupCodes.forEach((c) => console.log("   " + c));
  console.log("");
}

main()
  .catch((err) => {
    console.error("❌", err.message || err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect().catch(() => {}));
