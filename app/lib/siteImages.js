// app/lib/siteImages.js
//
// صور الموقع. الروابط الافتراضية في siteImageDefaults.mjs، لكن صور صفحة
// الخدمات (صورة كل خدمة + صورة الهيرو + صورة المقدمة) بقت ديناميكية من
// الداتابيز (كولكشن services) وبتتعدّل من لوحة الأدمن → تاب "الخدمات":
//
//   services.items[].image   → صورة كل خدمة
//   services.heroImage       → خلفية هيرو صفحة الخدمات
//   services.introImage      → صورة شريط التعريف
//
// لو الحقل فاضي في الداتابيز بنرجع للرابط الافتراضي من هنا.
import {
  IMG_BASE as BASE,
  DEFAULT_IMAGES,
  DEFAULT_SERVICE_IMAGES,
} from "./siteImageDefaults.mjs";

export const IMG_BASE = BASE;
export const IMAGES = DEFAULT_IMAGES;
export const SERVICE_IMAGES = DEFAULT_SERVICE_IMAGES;

// بيقبل بس http(s) أو مسار محلي يبدأ بـ "/" أو data:image — أي حاجة تانية
// (javascript: مثلًا) بترجع "" فنرجع للافتراضي.
export function safeImageUrl(value) {
  if (typeof value !== "string") return "";
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^\/(?!\/)/.test(v)) return v;
  if (/^data:image\//i.test(v)) return v;
  return "";
}

// صورة خدمة: الداتابيز الأول، وبعدين الافتراضي بتاع الـ slug، وبعدين "" (فيتعرض
// الرسم SVG البديل في ServiceVisual).
export function serviceImage(service) {
  return safeImageUrl(service?.image) || SERVICE_IMAGES[service?.slug] || "";
}

// صورة هيرو/مقدمة صفحة: قيمة الداتابيز لو صالحة، وإلا الافتراضي.
export function pageImage(value, fallback) {
  return safeImageUrl(value) || fallback || "";
}

// يجهّز رابط للاستخدام جوه CSS url("...") من غير ما يكسر الـ style.
export function cssUrl(value) {
  return String(value || "").replace(/[\s"'()\\]/g, (c) => encodeURIComponent(c));
}
