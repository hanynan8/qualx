// GET ?from&to → CSV بزيارات الفترة (UTF-8 مع BOM عشان Excel يقرا العربي صح).
import { mysteryAuth, json, loadBranches, loadVisits } from "../../../lib/mysteryDb";
import { CRITERIA, validatePeriod } from "../../../lib/mysteryShopping";

// 🔒 CSV injection: أي خلية تبدأ بـ = + - @ بنسبقها بـ ' عشان Excel مايعتبرهاش formula.
function cell(v) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request) {
  try {
    const auth = await mysteryAuth(request);
    if (auth.response) return auth.response;
    const sp = new URL(request.url).searchParams;
    const period = validatePeriod(sp.get("from"), sp.get("to"));
    if (period.error) return json({ error: period.error }, 400);
    const { from, to } = period.value;

    const [visits, branches] = await Promise.all([loadVisits(auth.userId), loadBranches(auth.userId)]);
    const nameOf = new Map(branches.map((b) => [String(b._id), b.name]));
    const rows = visits.filter((v) => v.date >= from && v.date <= to).sort((a, b) => a.date.localeCompare(b.date));

    const header = ["Date", "Branch", "Evaluator", "Status", ...CRITERIA.map((c) => c[0].toUpperCase() + c.slice(1)), "Rating (/5)", "Quality (%)", "Notes"];
    const lines = [header.map(cell).join(",")];
    for (const v of rows) {
      lines.push(
        [
          v.date,
          nameOf.get(v.branchId) || "",
          v.evaluator,
          v.status,
          ...CRITERIA.map((c) => v.scores?.[c] ?? ""),
          v.rating ?? "",
          v.rating != null ? Math.round((v.rating / 5) * 100) : "",
          v.notes,
        ]
          .map(cell)
          .join(",")
      );
    }
    return new Response("﻿" + lines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="merilex-visits-${from}_${to}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/mystery/export] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}
