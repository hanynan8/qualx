// app/api/cv/route.js
//
// التقديم على وظيفة برفع CV بصيغة PDF. مفتوح للزوار (زي /api/data?collection=form)
// فمحمي بـ: rate limit، honeypot، فحص حجم، وفحص إن الملف PDF فعلًا من محتواه.
// الملف بيتخزن في Vercel Blob (private) عن طريق app/lib/cvStorage.js، وبياناته
// في كولكشن cv_applications. الأدمن بيشوفها من بانل "CVs" في /admin.
//
// الطلب: multipart/form-data بالحقول:
//   file (PDF، لازم) · name · email · phone? · position? · message? · link? · website (honeypot)

import { connectToMongo } from "../../lib/mongodb";
import { getCvModel } from "../../lib/cvModel";
import { saveCv, deleteCv, StorageNotConfiguredError } from "../../lib/cvStorage";
import { enforceRateLimit } from "../../lib/rateLimit";
import { MAX_CV_BYTES, sanitizeFileName, validateCvFields, validateCvFile } from "../../lib/cvValidation";

export const runtime = "nodejs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// الـ body بيشمل الملف + باقي الحقول + overhead الـ multipart.
const MAX_REQUEST_BYTES = MAX_CV_BYTES + 256 * 1024;

export async function POST(request) {
  try {
    const rl = await enforceRateLimit(request, { keyPrefix: "cv:upload", limit: 8, windowSeconds: 600 });
    if (rl) return rl;

    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > MAX_REQUEST_BYTES) return json({ error: "file_too_large" }, 413);

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      return json({ error: "invalid_request" }, 400);
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ error: "invalid_request" }, 400);
    }

    // 🔒 honeypot: البوتات بتملا الحقل المخفي. بنرد بنجاح وهمي من غير ما نحفظ حاجة.
    const trap = form.get("website");
    if (typeof trap === "string" && trap.trim() !== "") return json({ ok: true }, 201);

    const { fields, error: fieldsError } = validateCvFields({
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      position: form.get("position"),
      message: form.get("message"),
      link: form.get("link"),
    });
    if (fieldsError) return json({ error: fieldsError }, 400);

    const file = form.get("file");
    const { buffer, error: fileError } = await validateCvFile(file);
    if (fileError) return json({ error: fileError }, fileError === "file_too_large" ? 413 : 400);

    // 1) الملف الأول في التخزين، 2) بعدين السجل. لو السجل فشل بنمسح الملف عشان ميبقاش يتيم.
    const stored = await saveCv(buffer);
    try {
      await connectToMongo();
      const doc = await getCvModel().create({
        ...fields,
        file: { ...stored, name: sanitizeFileName(file.name), size: buffer.length },
      });
      return json({ ok: true, id: String(doc._id) }, 201);
    } catch (dbErr) {
      await deleteCv(stored).catch((e) => console.error("[/api/cv] orphan cleanup failed:", e));
      throw dbErr;
    }
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      console.error("[/api/cv] storage not configured:", err.message);
      return json({ error: "storage_not_configured" }, 503);
    }
    console.error("[/api/cv] POST error:", err);
    return json({ error: "internal_error" }, 500);
  }
}
