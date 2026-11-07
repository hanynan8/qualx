// app/api/admin/career-pay/export/route.js — شيت إكسيل شهري للحسابات (admin-only).
//   GET ?month=YYYY-MM[&status=pay_approved|all]  (الافتراضي: المعتمد فقط)
// الشيت بيتجمّع تلقائيًا من الداتابيز وقت الطلب: شيت "Details" بكل البنود + شيت "Summary" بإجمالي كل شخص.
import ExcelJS from "exceljs";
import { connectToMongo } from "../../../../lib/mongodb";
import { logAudit } from "../../../../lib/auditLog";
import { adminGuard, adminJson as json } from "../../../../lib/careerAdmin";
import { getCareerAccountModel } from "../../../../lib/careerAuth";
import { getPayModel, MONTH_RE } from "../../../../lib/careerExtras";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const g = await adminGuard(request, "admin:career-pay:export", 10);
    if (g.response) return g.response;
    const sp = new URL(request.url).searchParams;
    const month = sp.get("month");
    if (!month || !MONTH_RE.test(month)) return json({ error: "invalid_month" }, 400);
    const all = sp.get("status") === "all";

    await connectToMongo();
    const docs = await getPayModel()
      .find({ month, ...(all ? {} : { status: "pay_approved" }) })
      .sort({ accountId: 1, createdAt: 1 })
      .limit(20000)
      .lean();
    const accounts = await getCareerAccountModel()
      .find({ _id: { $in: docs.map((d) => d.accountId) } }, "name email phone")
      .lean();
    const acc = new Map(accounts.map((a) => [String(a._id), a]));

    // خلايا الإكسيل: أي نص بيبدأ بـ = + - @ بيتحوّل لنص عادي (منع formula injection من بيانات المستخدمين).
    const safe = (v) => (typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

    const wb = new ExcelJS.Workbook();
    const details = wb.addWorksheet("Details");
    details.columns = [
      { header: "Name", key: "name", width: 26 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Job Title", key: "jobTitle", width: 40 },
      { header: "Compensation", key: "compensation", width: 15 },
      { header: "Reimbursement", key: "reimbursement", width: 15 },
      { header: "Total", key: "total", width: 12 },
      { header: "Currency", key: "currency", width: 10 },
      { header: "Status", key: "status", width: 16 },
    ];
    const summary = wb.addWorksheet("Summary");
    summary.columns = [
      { header: "Name", key: "name", width: 26 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Jobs", key: "jobs", width: 8 },
      { header: "Total", key: "total", width: 14 },
      { header: "Currency", key: "currency", width: 10 },
    ];

    const sums = new Map();
    for (const d of docs) {
      const a = acc.get(String(d.accountId)) || {};
      const total = (d.compensation || 0) + (d.reimbursement || 0);
      details.addRow({
        name: safe(a.name || ""),
        email: safe(a.email || ""),
        phone: safe(a.phone || ""),
        jobTitle: safe(d.jobTitle),
        compensation: d.compensation || 0,
        reimbursement: d.reimbursement || 0,
        total,
        currency: d.currency || "EGP",
        status: d.status,
      });
      const key = `${d.accountId}|${d.currency || "EGP"}`;
      const s = sums.get(key) || { name: safe(a.name || ""), email: safe(a.email || ""), phone: safe(a.phone || ""), jobs: 0, total: 0, currency: d.currency || "EGP" };
      s.jobs += 1;
      s.total += total;
      sums.set(key, s);
    }
    for (const s of sums.values()) summary.addRow(s);
    for (const ws of [details, summary]) {
      ws.getRow(1).font = { bold: true };
      ws.views = [{ state: "frozen", ySplit: 1 }];
    }

    const buf = await wb.xlsx.writeBuffer();
    await logAudit({ request, actor: g.session.user, action: "career.pay_exported", details: { month, rows: docs.length, all } });
    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="career-pay-${month}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[admin/career-pay] export error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
