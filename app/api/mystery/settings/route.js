// GET/PUT: إعدادات الداشبورد (اسم الجهة، الهدف، حدود "ممتاز" و"جيد").
import { MsSettings, mysteryAuth, json, readJson, loadSettings } from "../../../lib/mysteryDb";
import { validateSettings } from "../../../lib/mysteryShopping";

export async function GET(request) {
  try {
    const auth = await mysteryAuth(request);
    if (auth.response) return auth.response;
    return json({ settings: await loadSettings(auth.userId) });
  } catch (err) {
    console.error("[/api/mystery/settings] GET:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function PUT(request) {
  try {
    const auth = await mysteryAuth(request, { write: true });
    if (auth.response) return auth.response;
    const parsed = validateSettings(await readJson(request));
    if (parsed.error) return json({ error: parsed.error }, 400);
    await MsSettings().findOneAndUpdate({ owner: auth.userId }, { $set: parsed.value }, { upsert: true, new: true });
    return json({ settings: parsed.value });
  } catch (err) {
    console.error("[/api/mystery/settings] PUT:", err);
    return json({ error: "internal_error" }, 500);
  }
}
