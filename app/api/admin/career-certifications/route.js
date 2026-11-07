// app/api/admin/career-certifications/route.js — إدارة الشهادات/التدريب (admin-only).
//   GET → كل الشهادات   POST { title, description?, materialsUrl? } → إنشاء
import { connectToMongo } from "../../../lib/mongodb";
import { logAudit } from "../../../lib/auditLog";
import { adminGuard, adminJson as json } from "../../../lib/careerAdmin";
import { getCertModel, serializeCert, cleanCert } from "../../../lib/careerExtras";

export async function GET(request) {
  try {
    const g = await adminGuard(request, "admin:career-certs:list");
    if (g.response) return g.response;
    await connectToMongo();
    const docs = await getCertModel().find({}).sort({ createdAt: -1 }).limit(500).lean();
    return json({ items: docs.map((c) => ({ ...serializeCert(c), status: c.status })) });
  } catch (err) {
    console.error("[admin/career-certs] GET error:", err);
    return json({ error: "internal_error" }, 500);
  }
}

export async function POST(request) {
  try {
    const g = await adminGuard(request, "admin:career-certs:create", 30);
    if (g.response) return g.response;
    const { data, error } = cleanCert(await request.json().catch(() => null));
    if (error) return json({ error }, 400);
    await connectToMongo();
    const doc = await getCertModel().create(data);
    await logAudit({ request, actor: g.session.user, action: "career.cert_created", targetId: String(doc._id), details: { title: doc.title } });
    return json({ ok: true, id: String(doc._id) }, 201);
  } catch (err) {
    console.error("[admin/career-certs] POST error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
