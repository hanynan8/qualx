// GET ?type=visits|findings&from&to → CSV (UTF-8 مع BOM عشان Excel يقرا العربي صح).
import { auditAuth, json, loadBranches, loadFindings, loadVisits } from "../../../lib/auditDb";
import { validatePeriod } from "../../../lib/auditing";

// 🔒 CSV injection: أي خلية تبدأ بـ = + - @ بنسبقها بـ ' عشان Excel مايعتبرهاش formula.
function cell(v) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request) {
  try {
    const auth = await auditAuth(request);
    if (auth.response) return auth.response;
    const sp = new URL(request.url).searchParams;
    const period = validatePeriod(sp.get("from"), sp.get("to"));
    if (period.error) return json({ error: period.error }, 400);
    const { from, to } = period.value;
    const type = sp.get("type") === "findings" ? "findings" : "visits";

    const branches = await loadBranches(auth.userId);
    const nameOf = new Map(branches.map((b) => [String(b._id), b.name]));
    let header;
    let rows;
    if (type === "visits") {
      const visits = await loadVisits(auth.userId);
      header = ["Date", "Branch", "Auditor", "Status", "Compliance (%)", "Pass", "Fail", "N/A", "Critical", "Notes"];
      rows = visits
        .filter((v) => v.date >= from && v.date <= to)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((v) => [v.date, nameOf.get(v.branchId) || "", v.auditor, v.status, v.compliance ?? "", v.counts.pass, v.counts.fail, v.counts.na, v.counts.critical, v.notes]);
    } else {
      const findings = await loadFindings(auth.userId);
      header = ["Opened", "Branch", "Area", "Severity", "Finding", "Status", "Responsible", "Deadline", "Closed", "Resolution", "Details"];
      rows = findings
        .filter((f) => f.openedAt >= from && f.openedAt <= to)
        .sort((a, b) => a.openedAt.localeCompare(b.openedAt))
        .map((f) => [f.openedAt, nameOf.get(f.branchId) || "", f.area, f.severity, f.title, f.status, f.assignee, f.dueDate || "", f.closedAt || "", f.resolution, f.note]);
    }
    const lines = [header, ...rows].map((r) => r.map(cell).join(","));
    return new Response("\uFEFF" + lines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="merilex-audit-${type}-${from}_${to}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/audit/export] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}
