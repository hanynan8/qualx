// scripts/make-admin.mjs
//
// إنشاء حساب أدمن جديد، أو ترقية حساب موجود لأدمن، أو تغيير/إعادة ضبط
// باسورد أدمن (لو نسي الباسورد). ده الطريقة الوحيدة لإنشاء أول أدمن —
// مفيش تسجيل عام في الموقع.
//
// الاستخدام:
//   node scripts/make-admin.mjs admin@qualx.com
//
// بيسأل عن الاسم (لو حساب جديد) والباسورد (مخفي على الشاشة). لو الحساب موجود
// وسبت الباسورد فاضي، الباسورد بيفضل زي ما هو.
// لتشغيل من غير تفاعل (CI): ADMIN_NAME و ADMIN_PASSWORD كمتغيرات بيئة.
//
// أي تغيير هنا بيزوّد tokenVersion → كل الجلسات المفتوحة للحساب بتتبطل، وبيتشال
// أي قفل أو إيقاف على الحساب.

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connect, getUserModel, ask, isEmail } from "./_shared.mjs";

const MIN_ADMIN_PASSWORD = 12;

async function main() {
  const email = (process.argv[2] || "").toLowerCase().trim();
  if (!isEmail(email)) {
    console.error("الاستخدام: node scripts/make-admin.mjs admin@example.com");
    process.exit(1);
  }

  await connect();
  const User = getUserModel();
  const existing = await User.findOne({ email });

  let name = process.env.ADMIN_NAME || existing?.name || "";
  if (!name) name = await ask("اسم الأدمن: ");
  if (!name) throw new Error("الاسم مطلوب");
  if (name.includes("@")) throw new Error("الاسم ماينفعش يحتوي على @ (بيتلخبط مع تسجيل الدخول بالإيميل)");

  const nameClash = await User.findOne({
    name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    ...(existing ? { _id: { $ne: existing._id } } : {}),
  });
  if (nameClash) throw new Error(`الاسم "${name}" مستخدم في حساب تاني`);

  let password = process.env.ADMIN_PASSWORD || "";
  if (!password) {
    password = await ask(
      existing
        ? "باسورد جديد (سيبه فاضي عشان يفضل القديم): "
        : `الباسورد (${MIN_ADMIN_PASSWORD} حرف على الأقل): `,
      { hidden: true }
    );
  }
  if (!existing && !password) throw new Error("الباسورد مطلوب لحساب جديد");
  if (password && password.length < MIN_ADMIN_PASSWORD) {
    throw new Error(`الباسورد لازم يكون ${MIN_ADMIN_PASSWORD} حرف على الأقل`);
  }
  if (password && password.length > 128) throw new Error("الباسورد طويل جدًا (الحد 128)");

  const update = {
    name,
    role: "admin",
    status: "active",
    loginFailedAttempts: 0,
    loginFirstFailedAt: null,
    loginLockedUntil: null,
  };
  if (password) {
    update.password = await bcrypt.hash(password, 12);
    update.passwordChangedAt = new Date();
  }

  if (existing) {
    await User.updateOne({ _id: existing._id }, { $set: update, $inc: { tokenVersion: 1 } });
    console.log(`✅ اتحدّث الحساب ${email} (role = admin). الجلسات القديمة اتبطلت.`);
  } else {
    await User.create({ email, ...update, tokenVersion: 0, mfaEnabled: false });
    console.log(`✅ اتعمل حساب أدمن جديد: ${email}`);
  }
  console.log(`👉 فعّل MFA: node scripts/setup-mfa.mjs ${email}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("❌", err.message || err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
