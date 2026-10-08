// app/api/admin/stats/route.js
//
// أرقام تبويب Overview: عدد الحسابات حسب الـ role، رسائل الزوار، الخدمات
// والوظائف المنشورة، + اتجاه آخر 6 شهور للتسجيلات والرسائل. admin-only.

import { connectToMongo, getAuthModel } from "../../../lib/mongodb";
import { requireRole } from "../../../lib/rbac";
import { getModelForCollection } from "../../../lib/contentGuard";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// بيحوّل نتيجة aggregate ({_id:{y,m}, count}) لمصفوفة كاملة الـ 6 شهور.
function fillLastSixMonths(rows) {
  const byKey = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}`, r.count]));
  const out = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  cursor.setMonth(cursor.getMonth() - 5);
  for (let i = 0; i < 6; i++) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth() + 1;
    out.push({ year: y, month: m, count: byKey.get(`${y}-${m}`) || 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

const monthGroup = {
  $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, count: { $sum: 1 } },
};

export async function GET() {
  try {
    const auth = await requireRole(["admin"]);
    if (auth.response) return auth.response;

    await connectToMongo();
    const Auth = getAuthModel();
    const Form = getModelForCollection("form");
    const Services = getModelForCollection("services");
    const Careers = getModelForCollection("careers");

    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const [roleCounts, suspended, messagesTotal, messages30d, signupsRaw, messagesRaw, servicesDoc, careersDoc] =
      await Promise.all([
        Auth.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
        Auth.countDocuments({ status: "suspended" }),
        Form.countDocuments({}),
        Form.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }),
        Auth.aggregate([{ $match: { createdAt: { $gte: since } } }, monthGroup]),
        Form.aggregate([{ $match: { createdAt: { $gte: since } } }, monthGroup]),
        Services.findOne({}).lean(),
        Careers.findOne({}).lean(),
      ]);

    const byRole = Object.fromEntries(roleCounts.map((r) => [r._id || "user", r.count]));

    return json({
      counts: {
        users: byRole.user || 0,
        admins: byRole.admin || 0,
        suspended,
        messagesTotal,
        messages30d,
        services: Array.isArray(servicesDoc?.items) ? servicesDoc.items.length : 0,
        careers: Array.isArray(careersDoc?.items) ? careersDoc.items.length : 0,
      },
      signupsTrend: fillLastSixMonths(signupsRaw),
      messagesTrend: fillLastSixMonths(messagesRaw),
    });
  } catch (err) {
    console.error("[/api/admin/stats] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
