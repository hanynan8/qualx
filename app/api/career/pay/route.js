// app/api/career/pay/route.js — My Pay: مستحقات الحساب الحالي (accountId من الجلسة).
// ?month=YYYY-MM (اختياري) بيفلتر على شهر. بيرجّع كمان الشهور المتاحة وإجماليات حسب العملة.
import { connectToMongo } from "../../../lib/mongodb";
import { requireCareer, careerJson } from "../../../lib/careerAuth";
import { getPayModel, serializePay, MONTH_RE } from "../../../lib/careerExtras";

export async function GET(request) {
  const { user, response } = await requireCareer();
  if (response) return response;
  try {
    const month = new URL(request.url).searchParams.get("month");
    if (month && !MONTH_RE.test(month)) return careerJson({ error: "invalid_month" }, 400);
    await connectToMongo();
    const Pay = getPayModel();
    const [months, docs] = await Promise.all([
      Pay.distinct("month", { accountId: user.id }),
      Pay.find({ accountId: user.id, ...(month ? { month } : {}) }).sort({ month: -1, createdAt: -1 }).limit(1000).lean(),
    ]);
    const items = docs.map(serializePay);

    const totals = {}; // { EGP: { approved, pending } }
    for (const it of items) {
      const t = (totals[it.currency] ||= { approved: 0, pending: 0 });
      if (it.status === "pay_approved") t.approved += it.total;
      else if (it.status === "pending_review") t.pending += it.total;
    }
    return careerJson({ items, totals, months: months.sort().reverse() });
  } catch (err) {
    console.error("[career-pay] error:", err);
    return careerJson({ error: "internal_error" }, 500);
  }
}
