// app/admin/tabsConfig.js
//
// تعريف تابات لوحة الأدمن. كل تاب = صفحة (أو الناف بار / الفوتر) وبيشاور على
// الكولكشن اللي بيغذّيها في الداتابيز:
//
//   collection : اسم الكولكشن في مونجو.
//   mode       : "singleton" (document واحد فيه محتوى الصفحة) | "list" (عدة
//                documents زي رسائل الزوار).
//   href       : رابط الصفحة على الموقع (زرار "فتح الصفحة").
//   visible    : أنماط للحقول اللي بتظهر في التاب ("*" = أي مفتاح). لو مفيش،
//                كل الحقول بتظهر. زرار "عرض كل الحقول" بيتخطّاها دايمًا، فمفيش
//                حاجة في الداتابيز بتبقى بعيدة عن الأدمن.
//   items      : مدير عناصر مخصص (إضافة/حذف/ترتيب/إعادة تسمية) بيحافظ على
//                التزامن بين القائمة وترجماتها في كل لغة.
//   pageKey    : مفتاح قالب نصوص الصفحة الافتراضية (pageDefaults.js).

export const LANGS = ["en", "ar"];

export const TABS = [
  {
    id: "home",
    label: "الرئيسية",
    hint: "نصوص الهيرو وقسم الخدمات والـ CTA في الصفحة الرئيسية",
    collection: "home",
    mode: "singleton",
    href: "/",
    visible: [
      "i18n.*.heroTitle",
      "i18n.*.exploreServices",
      "i18n.*.whatWeDoTitle",
      "i18n.*.viewAllServices",
      "i18n.*.learnMore",
      "i18n.*.ctaTitle",
      "i18n.*.ctaSubtitle",
      "i18n.*.ctaButton",
    ],
  },
  {
    id: "about",
    label: "من نحن",
    hint: "صفحة About — بتقرا من نفس document الرئيسية (كولكشن home)",
    collection: "home",
    mode: "singleton",
    href: "/about",
    pageKey: "about",
    visible: [
      "cardIcons",
      "i18n.*.heroSummary",
      "i18n.*.cards",
      "i18n.*.uspLabel",
      "i18n.*.uspText",
      "i18n.*.whoWeAreTitle",
      "i18n.*.page",
    ],
  },
  {
    id: "services",
    label: "الخدمات",
    hint: "صفحة الخدمات وصفحات تفاصيل كل خدمة",
    collection: "services",
    mode: "singleton",
    href: "/solutions",
    pageKey: "services",
    items: {
      listKey: "items",
      idKey: "slug",
      idLabel: "slug الخدمة (إنجليزي بشرطات، مثال: new-service)",
      langPath: "items",
      template: { title: "", short: "", description: "", highlights: [] },
      extra: { icon: "eye" },
      titleOf: (lang) => lang?.title,
    },
  },
  {
    id: "careers",
    label: "الوظائف",
    hint: "صفحة الوظائف وقائمة الوظائف المتاحة",
    collection: "careers",
    mode: "singleton",
    href: "/careers",
    pageKey: "careers",
    items: {
      listKey: "items",
      idKey: "slug",
      idLabel: "slug الوظيفة (إنجليزي بشرطات، مثال: sales-manager)",
      langPath: "items",
      template: { title: "", type: "", location: "", description: "" },
      extra: {},
      titleOf: (lang) => lang?.title,
    },
  },
  {
    id: "navbar",
    label: "الناف بار",
    hint: "روابط وقوائم الشريط العلوي",
    collection: "navbar",
    mode: "singleton",
    markManaged: true,
    items: {
      listKey: "links",
      idKey: "id",
      idLabel: "id الرابط (مثال: pricing)",
      langPath: "links",
      template: "",
      extra: { href: "/" },
      titleOf: (lang) => (typeof lang === "string" ? lang : null),
    },
  },
  {
    id: "footer",
    label: "الفوتر",
    hint: "الوصف وروابط الشركة وبيانات التواصل",
    collection: "footer",
    mode: "singleton",
    markManaged: true,
    items: {
      listKey: "links",
      idKey: "id",
      idLabel: "id الرابط (مثال: pricing)",
      langPath: "links",
      template: "",
      extra: { href: "/" },
      titleOf: (lang) => (typeof lang === "string" ? lang : null),
    },
  },
  {
    id: "messages",
    label: "رسائل الزوار",
    hint: "رسائل فورم التواصل (كولكشن form)",
    collection: "form",
    mode: "list",
    newestFirst: true,
    summaryKeys: ["name", "email", "phone", "service", "message"],
  },
  { id: "collections", label: "كولكشنز أخرى", hint: "أي كولكشن تاني في الداتابيز", mode: "explorer" },
  { id: "security", label: "الحساب والأمان", mode: "security" },
];

// كولكشنز ليها تاب مخصص — بنخفيها من تاب "كولكشنز أخرى" عشان ما تتكررش.
export const DEDICATED_COLLECTIONS = new Set(TABS.map((t) => t.collection).filter(Boolean));

// ───────────────────── visibility patterns ─────────────────────
// المسار ظاهر لو هو أب لنمط (عشان نوصل للحقل) أو تابع ليه (جوه الحقل).
export function isPathVisible(patterns, path) {
  if (!patterns || patterns.length === 0) return true;
  return patterns.some((pattern) => {
    const parts = pattern.split(".");
    const n = Math.min(parts.length, path.length);
    for (let i = 0; i < n; i++) {
      if (parts[i] !== "*" && parts[i] !== String(path[i])) return false;
    }
    return true;
  });
}
