// app/lib/siteConfig.js
// مصدر واحد لبيانات الشركة المستخدمة في الميتاداتا (SEO / Open Graph / JSON-LD).
export const SITE_URL = "https://www.merilex.online";
export const SITE_NAME = "Merilex";
export const SITE_TAGLINE = "Quality Assurance & Customer Experience";
export const SITE_DESCRIPTION =
  "Merilex evaluates customer experience and quality control for businesses and branches across Egypt through Mystery Shopping, Auditing Visits, Managed Services, and CX consulting — with confidential evaluation visits and documented reports.";
export const SITE_DESCRIPTION_AR =
  "ميريليكس شركة متخصصة في تقييم تجربة العملاء ومراقبة الجودة (التسوق السري وضمان الجودة) للشركات والفروع في مصر.";

export const SITE_KEYWORDS = [
  "Merilex",
  "Mystery Shopping",
  "Mystery Shopper Egypt",
  "Quality Assurance",
  "Customer Experience",
  "CX",
  "Auditing Visits",
  "Managed Services",
  "Quality Control",
  "Branch Evaluation",
  "Egypt",
  "Cairo",
  "تسوق سري",
  "تجربة العملاء",
  "ضمان الجودة",
  "زيارات تدقيق",
  "خدمات مُدارة",
  "مصر",
  "القاهرة",
];

export const SITE_CONTACT = {
  email: "Merilex.Consulting@gmail.com",
  phone: "+20 121 024 5637",
  whatsapp: "https://wa.me/201210245637",
  facebook: "https://www.facebook.com/profile.php?id=61594845413905",
  linkedin: "https://www.linkedin.com/company/merilex-consulting/",
  city: "Cairo",
  country: "EG",
};

export const SITE_THEME_COLOR = "#0B1F3A"; // navy

// Open Graph لصفحة فرعية: Next بيستبدل openGraph الأب بالكامل، فلازم نكرر
// الصورة واسم الموقع هنا عشان مايتمسحوش.
export function pageOpenGraph(path, title, description) {
  return {
    type: "website",
    url: path,
    siteName: SITE_NAME,
    title: `${title} — ${SITE_NAME}`,
    description: description || SITE_DESCRIPTION,
    locale: "en_US",
    alternateLocale: ["ar_EG"],
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` }],
  };
}
