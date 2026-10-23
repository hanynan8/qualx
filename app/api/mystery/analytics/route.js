// GET ?from&to → مصفوفة فرع × معيار، توزيع التقييمات، أداء المقيّمين.
import { mysteryAuth, json, loadBranches, loadVisits } from "../../../lib/mysteryDb";
import { computeAnalytics, validatePeriod } from "../../../lib/mysteryShopping";

export async function GET(request) {
  try {
    const auth = await mysteryAuth(request);
    if (auth.response) return auth.response;
    const sp = new URL(request.url).searchParams;
    const period = validatePeriod(sp.get("from"), sp.get("to"));
    if (period.error) return json({ error: period.error }, 400);
    const [visits, branches] = await Promise.all([loadVisits(auth.userId), loadBranches(auth.userId)]);
    return json(computeAnalytics({ visits, branches, ...period.value }));
  } catch (err) {
    console.error("[/api/mystery/analytics] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}
