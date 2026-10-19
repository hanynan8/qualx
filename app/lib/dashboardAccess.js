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

export function canAccessMysteryDashboard(user) {
  return Boolean(user);
}
