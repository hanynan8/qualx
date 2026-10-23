// GET/PUT: إعدادات الداشبورد (الهدف، حدود الالتزام، مهل حل الملاحظات، قايمة الفحص).
import { AuSettings, auditAuth, json, readJson, loadSettings } from "../../../lib/auditDb";
import { validateSettings } from "../../../lib/auditing";

export async function GET(request) {
  try {
    const auth = await auditAuth(request);
    if (auth.response) return auth.response;
    return json({ settings: await loadSettings(auth.userId) });
  } catch (err) {
    console.error("[/api/audit/settings] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function PUT(request) {
  try {
    const auth = await auditAuth(request, { write: true });
    if (auth.response) return auth.response;
    const parsed = validateSettings(await readJson(request, 128 * 1024));
    if (parsed.error) return json({ error: parsed.error }, 400);
    await AuSettings().findOneAndUpdate({ owner: auth.userId }, { $set: parsed.value }, { upsert: true, new: true });
    return json({ settings: parsed.value });
  } catch (err) {
    console.error("[/api/audit/settings] PUT:", err);
    return json({ error: "internal_error" }, 500);
  }
}
