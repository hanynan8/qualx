// app/lib/siteImages.js
//
// كل صور الموقع بتتحمّل من ريبو merlix-files على GitHub (raw).
// الـ CSP في proxy.js بيسمح بالمسار ده بس: IMG_BASE.
export const IMG_BASE = "https://raw.githubusercontent.com/hanynan8/merlix-files/main/";

const url = (file) => IMG_BASE + encodeURIComponent(file);

export const IMAGES = {
  logo: url("WhatsApp Image 2026-10-08 at 6.27.24 AM.jpeg"),
  homeHero: url("WhatsApp Image 2026-10-08 at 11.47.02 PM.jpeg"),
  solutionsHero: url("WhatsApp Image 2026-y10-08 at 11.47.04 PM.jpeg"),
  solutionsIntro: url("WhatsApp Image 20h26-10-08 at 11.47.04 PM.jpeg"),
  aboutHero: url("WhatsApp Imagqe 2026-10-08 at 11.47.05 PM.jpeg"),
  aboutWhoWeAre: url("WhatsApp Image d2026-10-08 at 11.47.03 PM.jpeg"),
  careersHero: url("WhatsApp Image 2d026-10-08 at 11.47.03 PM.jpeg"),
  serviceMysteryShopping: url("WhatsApp Imavge 2026-10-08 at 11.47.04 PM.jpeg"),
  serviceOperationalAudit: url("WhatsApp Image 2026-10-08 at 11.47.03 PM.jpeg"),
  serviceCustomerExperience: url("WhatsApp Imagde 2026-10-08 at 11.47.03 PM.jpeg"),
  serviceManagedServices: url("WhatsApp Ifmage 2d026-10-08 at 11.47.03 PM.jpeg"),
};

// صورة كل خدمة حسب الـ slug (بتُستخدم في كروت السوليوشن وصفحة تفاصيل الخدمة)
export const SERVICE_IMAGES = {
  "mystery-shopping": IMAGES.serviceMysteryShopping,
  "auditing-visits": IMAGES.serviceOperationalAudit,
  "customer-experience": IMAGES.serviceCustomerExperience,
  "managed-services": IMAGES.serviceManagedServices,
};