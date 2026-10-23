// app/dashboard/auditing-visits/checklist.js
//
// قايمة الفحص الافتراضية (إنجليزي / عربي) لكل مجال تدقيق. المستخدم يقدر يعدّلها من الإعدادات
// (settings.checklist) — وساعتها بتتحفظ كما هي بغض النظر عن اللغة.

import { AREAS } from "./client";

export const DEFAULT_CHECKLIST = {
  en: {
    products: [
      "Products are within their expiry dates",
      "Products are stored at the correct temperature",
      "Products are labelled and priced correctly",
      "Display matches the approved standard",
      "Stock is rotated (first in, first out)",
      "No damaged or unapproved products on sale",
    ],
    facility: [
      "Exterior, signage and entrance are clean and in good condition",
      "Lighting and air conditioning are working properly",
      "Equipment is working and maintained",
      "Floors, walls and ceilings are in good condition",
      "Customer areas are clean and tidy",
      "Storage areas are organised and accessible",
    ],
    hygiene_safety: [
      "Staff wear complete, clean uniforms",
      "Hand-washing facilities are stocked and used",
      "Cleaning schedule is followed and documented",
      "Pest control measures are in place",
      "Fire extinguishers are accessible and valid",
      "First-aid kit is available and complete",
      "Chemicals are stored safely and labelled",
    ],
    procedures: [
      "Opening and closing procedures are followed",
      "Daily records and checklists are completed",
      "Customer complaints are logged and handled",
      "Staff are trained on the standard procedures",
      "Cash handling and receipts follow policy",
    ],
  },
  ar: {
    products: [
      "المنتجات داخل تاريخ الصلاحية",
      "المنتجات متخزنة في درجة الحرارة الصحيحة",
      "المنتجات عليها بطاقات وأسعار صحيحة",
      "العرض مطابق للمعيار المعتمد",
      "بيتم تدوير المخزون (الأقدم يخرج الأول)",
      "مفيش منتجات تالفة أو غير معتمدة معروضة للبيع",
    ],
    facility: [
      "الواجهة واللافتات والمدخل نضاف وفي حالة كويسة",
      "الإضاءة والتكييف شغالين كويس",
      "المعدات شغالة وبتتعمل لها صيانة",
      "الأرضيات والحيطان والأسقف في حالة كويسة",
      "مناطق العملاء نضيفة ومرتبة",
      "أماكن التخزين منظمة وسهل الوصول ليها",
    ],
    hygiene_safety: [
      "الموظفين لابسين يونيفورم كامل ونضيف",
      "أدوات غسل الإيدين متوفرة ومستخدمة",
      "جدول النظافة متّبع ومتوثّق",
      "إجراءات مكافحة الحشرات مطبّقة",
      "طفايات الحريق متاحة وصالحة",
      "حقيبة الإسعافات الأولية متوفرة وكاملة",
      "المواد الكيميائية متخزنة بأمان وعليها بطاقات",
    ],
    procedures: [
      "إجراءات الفتح والإغلاق متّبعة",
      "السجلات وقوايم الفحص اليومية مستوفاة",
      "شكاوى العملاء بتتسجّل وبتتعالج",
      "الموظفين متدربين على الإجراءات القياسية",
      "التعامل مع النقدية والإيصالات حسب السياسة",
    ],
  },
};

// القايمة الفعلية: المخصّصة لو موجودة (لكل مجال)، وإلا الافتراضية بلغة الواجهة.
export function checklistFor(settings, language) {
  const base = DEFAULT_CHECKLIST[language] || DEFAULT_CHECKLIST.en;
  const custom = settings?.checklist;
  return Object.fromEntries(
    AREAS.map((a) => [a, custom && Array.isArray(custom[a]) && custom[a].length ? custom[a] : base[a]])
  );
}
