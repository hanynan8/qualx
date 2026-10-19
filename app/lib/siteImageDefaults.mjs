// app/lib/siteImageDefaults.mjs
//
// الروابط الافتراضية (fallback) لصور الموقع. ملف .mjs عشان يتقرا من الموقع
// (siteImages.js) ومن سكريبتات node (scripts/*.mjs) من نفس المصدر.
//
// الصور بقت ديناميكية: الأدمن بيغيّرها من تاب "الخدمات" (محفوظة في كولكشن
// services في الداتابيز). الروابط دي بتتستخدم بس لو الحقل في الداتابيز فاضي.
export const IMG_BASE = "https://raw.githubusercontent.com/hanynan8/merlix-files/main/";

export const imgUrl = (file) => IMG_BASE + encodeURIComponent(file);

export const DEFAULT_IMAGES = {
  logo: imgUrl("WhatsApp Image 2026-10-08 at 6.27.24 AM.jpeg"),
  homeHero: imgUrl("WhatsApp Image 2026-10-08 at 11.47.02 PM.jpeg"),
  solutionsHero: imgUrl("WhatsApp Image 2026-y10-08 at 11.47.04 PM.jpeg"),
  solutionsIntro: imgUrl("WhatsApp Image 20h26-10-08 at 11.47.04 PM.jpeg"),
  aboutHero: imgUrl("WhatsApp Imagqe 2026-10-08 at 11.47.05 PM.jpeg"),
  aboutWhoWeAre: imgUrl("WhatsApp Image d2026-10-08 at 11.47.03 PM.jpeg"),
  careersHero: imgUrl("WhatsApp Image 2d026-10-08 at 11.47.03 PM.jpeg"),
  serviceMysteryShopping: imgUrl("WhatsApp Imavge 2026-10-08 at 11.47.04 PM.jpeg"),
  serviceOperationalAudit: imgUrl("WhatsApp Image 2026-10-08 at 11.47.03 PM.jpeg"),
  serviceCustomerExperience: imgUrl("WhatsApp Imagde 2026-10-08 at 11.47.03 PM.jpeg"),
  serviceManagedServices: imgUrl("WhatsApp Ifmage 2d026-10-08 at 11.47.03 PM.jpeg"),
};

// صورة كل خدمة حسب الـ slug (القيمة الافتراضية لو مفيش image في الداتابيز).
export const DEFAULT_SERVICE_IMAGES = {
  "mystery-shopping": DEFAULT_IMAGES.serviceMysteryShopping,
  "auditing-visits": DEFAULT_IMAGES.serviceOperationalAudit,
  "customer-experience": DEFAULT_IMAGES.serviceCustomerExperience,
  "managed-services": DEFAULT_IMAGES.serviceManagedServices,
};
