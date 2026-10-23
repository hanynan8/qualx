// GET ?from&to&today → كل أرقام داشبورد التدقيق متحسبة من الزيارات والملاحظات الفعلية.
import { auditAuth, json, loadBranches, loadFindings, loadSettings, loadVisits } from "../../../lib/auditDb";
import { computeDashboard, validatePeriod, toDay } from "../../../lib/auditing";

export async function GET(request) {
  try {
    const auth = await auditAuth(request);
    if (auth.response) return auth.response;
    const sp = new URL(request.url).searchParams;
    const period = validatePeriod(sp.get("from"), sp.get("to"));
    if (period.error) return json({ error: period.error }, 400);

    const { userId } = auth;
    const [visits, findings, branches, settings] = await Promise.all([loadVisits(userId), loadFindings(userId), loadBranches(userId), loadSettings(userId)]);
    const today = /^\d{4}-\d{2}-\d{2}$/.test(sp.get("today") || "") ? sp.get("today") : toDay(new Date());
    const data = computeDashboard({ visits, findings, branches, ...period.value, settings, today });
    return json({ ...data, settings, branchCount: branches.length });
  } catch (err) {
    console.error("[/api/audit/dashboard] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}
