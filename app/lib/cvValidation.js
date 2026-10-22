// app/lib/cvValidation.js
//
// دوال تحقق صافية (من غير DB ولا تخزين) لرفع الـ CV. مستخدمة في
// app/api/cv/route.js، ومتفصولة عشان تتختبر لوحدها.

// ⚠️ Vercel بتحدّ حجم الـ request body للـ serverless functions بـ 4.5MB، فالحد
// هنا 4MB عشان يفضل فيه هامش لباقي حقول الفورم. لو غيّرت الاستضافة وعايز ملفات
// أكبر، غيّر الرقم ده + النص اللي في ContactFormProvider.
export const MAX_CV_BYTES = 4 * 1024 * 1024;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CV_FIELD_LIMITS = {
  name: 200,
  email: 254,
  phone: 40,
  position: 200,
  message: 5000,
  link: 500,
};

// أي PDF حقيقي بيبدأ بـ "%PDF-" (المواصفة بتسمح بـ header جوه أول 1024 بايت).
// ده فحص المحتوى الفعلي — مش بنثق في اسم الملف ولا الـ MIME اللي بيبعته المتصفح.
export function isPdfBuffer(buf) {
  if (!buf || buf.length < 5) return false;
  return buf.subarray(0, 1024).toString("latin1").includes("%PDF-");
}

// اسم الملف الأصلي بيتخزن للعرض/التحميل بس، ومش بيتستخدم أبدًا في مسار التخزين.
export function sanitizeFileName(name) {
  let base = String(name || "cv.pdf").split(/[\\/]/).pop() || "cv.pdf";
  base = base.replace(/[\u0000-\u001f\u007f"<>:|?*]/g, "").trim().slice(0, 120);
  if (!base) base = "cv.pdf";
  if (!/\.pdf$/i.test(base)) base = `${base}.pdf`;
  return base;
}

function str(v) {
  return typeof v === "string" ? v.trim() : "";
}

// بيرجّع { fields } نظيفة أو { error } برسالة (كود) للعميل.
export function validateCvFields(raw) {
  const fields = {
    name: str(raw.name),
    email: str(raw.email),
    phone: str(raw.phone),
    position: str(raw.position),
    message: str(raw.message),
    link: str(raw.link),
  };

  for (const [key, max] of Object.entries(CV_FIELD_LIMITS)) {
    if (fields[key].length > max) return { error: `field_too_long:${key}` };
  }
  if (!fields.name) return { error: "name_required" };
  if (!EMAIL_RE.test(fields.email)) return { error: "invalid_email" };

  if (fields.link) {
    try {
      const u = new URL(fields.link);
      if (u.protocol !== "http:" && u.protocol !== "https:") return { error: "invalid_link" };
    } catch {
      return { error: "invalid_link" };
    }
  }
  return { fields };
}

// بيفحص الملف نفسه (File من FormData). بيرجّع { buffer } أو { error }.
export async function validateCvFile(file) {
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return { error: "file_required" };
  }
  if (!file.size) return { error: "file_empty" };
  if (file.size > MAX_CV_BYTES) return { error: "file_too_large" };

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_CV_BYTES) return { error: "file_too_large" };
  if (!isPdfBuffer(buffer)) return { error: "file_not_pdf" };
  return { buffer };
}
