// GET ?from=YYYY-MM-DD&to=YYYY-MM-DD → كل أرقام الداشبورد متحسبة من الزيارات الفعلية.
import { MsAction, mysteryAuth, json, loadBranches, loadSettings, loadVisits } from "../../../lib/mysteryDb";
import { computeDashboard, validatePeriod, toDay, addDays } from "../../../lib/mysteryShopping";

export async function GET(request) {
  try {
    const auth = await mysteryAuth(request);
    if (auth.response) return auth.response;
    const sp = new URL(request.url).searchParams;
    const period = validatePeriod(sp.get("from"), sp.get("to"));
    if (period.error) return json({ error: period.error }, 400);

    const { userId } = auth;
    const [visits, branches, settings, openActions] = await Promise.all([
      loadVisits(userId),
      loadBranches(userId),
      loadSettings(userId),
      MsAction().find({ owner: userId, status: { $ne: "done" } }).lean(),
    ]);

    const today = sp.get("today") && /^\d{4}-\d{2}-\d{2}$/.test(sp.get("today")) ? sp.get("today") : toDay(new Date());
    const data = computeDashboard({ visits, branches, ...period.value, settings, today });

    const nameOf = new Map(branches.map((b) => [String(b._id), b.name]));
    const horizon = addDays(today, 7);
    const scheduled = visits
      .filter((v) => v.status === "scheduled" && v.date <= horizon)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6)
      .map((v) => ({ id: v.id, date: v.date, branch: nameOf.get(v.branchId) || "—", overdue: v.date < today }));
    const overdueActions = openActions.filter((a) => a.dueDate && toDay(a.dueDate) < today).length;

    return json({
      ...data,
      settings,
      branchCount: branches.length,
      openActions: openActions.length,
      alerts: { ...data.alerts, overdueActions, items: scheduled },
    });
  } catch (err) {
    console.error("[/api/mystery/dashboard] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}
