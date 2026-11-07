// app/lib/dashboardAccess.js
//
// نقطة واحدة بتحدد مين يقدر يدخل داشبورد الميستري شوبنج.
//
// 🔓 دلوقتي: أي مستخدم مسجّل دخول يقدر يدخل.
// 💳 لاحقًا (لما الداشبورد تبقى للعملاء اللي دافعين بس): غيّر الدالة دي فقط —
//    مثلًا اقرا حقل زي `user.plans` / `user.mysteryShoppingActive` من الداتابيز —
//    وكل اللي بيستخدمها (layout الداشبورد + أي API) هيتحدّث تلقائيًا.

export const MYSTERY_DASHBOARD_PATH = "/dashboard/mystery-shopping";
export const MYSTERY_SERVICE_PATH = "/solutions/mystery-shopping";

// 🔒 الأدمن يقدر يحجب داشبورد معيّن عن حساب بعينه (Users → Manage → Dashboard access).
// الحجب بيتخزن في auth.blockedDashboards وبيوصل لهنا عن طريق الـ JWT (بيتحدّث خلال ~60 ثانية).
// الأدمن نفسه مش بيتحجب أبدًا.
const isBlocked = (user, key) => !["admin", "hr", "editor"].includes(user?.role) && Array.isArray(user?.blockedDashboards) && user.blockedDashboards.includes(key);

export function canAccessMysteryDashboard(user) {
  return Boolean(user) && !isBlocked(user, "mystery");
}

// ───────────── داشبورد التدقيق التشغيلي (Auditing Visits) ─────────────
// نفس قاعدة الميستري شوبنج: أي مستخدم مسجّل دخول. لما تتحصر على المشتركين المدفوعين
// غيّر الدالة دي بس (layout + كل راوتات /api/audit بتستخدمها).
export const AUDIT_DASHBOARD_PATH = "/dashboard/auditing-visits";
export const AUDIT_SERVICE_PATH = "/solutions/auditing-visits";

export function canAccessAuditDashboard(user) {
  return Boolean(user) && !isBlocked(user, "audit");
}
