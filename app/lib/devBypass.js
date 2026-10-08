// app/lib/devBypass.js
//
// ⚠️ مؤقت للتطوير فقط: تعطيل تسجيل الدخول للوحة الأدمن (/admin و /api/admin/*)
// عشان تشتغل على اللوحة من غير login.
//
// - شغّال تلقائيًا في وضع التطوير (npm run dev) بس.
// - مستحيل يشتغل في production (npm run build / start): الشرط NODE_ENV !== "production"
//   ثابت في الكود، فمفيش متغير بيئة يقدر يفتحه هناك.
// - لإيقافه في التطوير: حط ADMIN_AUTH_DISABLED=false في .env.local.
// - 🔒 لما تخلّص تطوير: امسح الملف ده، وامسح الاستخدامات بتاعته (grep devBypass).

export const ADMIN_AUTH_DISABLED =
  process.env.NODE_ENV !== "production" && process.env.ADMIN_AUTH_DISABLED !== "false";

export const DEV_ADMIN_USER = {
  id: "dev-admin",
  name: "Dev Admin",
  email: "dev-admin@localhost",
  role: "admin",
};

if (ADMIN_AUTH_DISABLED) {
  console.warn("⚠️  [devBypass] تسجيل دخول الأدمن معطّل (وضع التطوير فقط). أي حد يقدر يفتح /admin.");
}