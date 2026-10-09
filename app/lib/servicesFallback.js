// app/lib/servicesFallback.js
//
// محتوى الخدمات الافتراضي (نفس محتوى scripts/seed.mjs). بتستخدمه صفحة تفاصيل
// الخدمة كـ fallback لو الداتابيز مفيهاش الخدمة دي أو مفيهاش وصفها/مميزاتها،
// بدل ما تعرض "Service not found".
export const FALLBACK_SERVICES = {
  items: [
    { slug: "mystery-shopping", icon: "eye" },
    { slug: "managed-services", icon: "users" },
    { slug: "auditing-visits", icon: "clipboard-check" },
    { slug: "customer-experience", icon: "heart-handshake" },
  ],
  i18n: {
    en: {
      pageBadge: "Our services",
      pageTitle: "Four ways we help you see, and improve, the customer experience.",
      pageIntro:
        "From a single confidential visit to a fully managed quality department, every service is built to turn real customer experience into evidence, and evidence into action.",
      seeHowItWorks: "See how it works",
      allServices: "All services",
      howItWorks: "How it works",
      askAboutService: "Ask about this service",
      whatsIncluded: "What's included",
      otherServices: "Other services",
      learnMore: "Learn more →",
      items: {
        "mystery-shopping": {
          title: "Mystery Shopping Visits",
          short: "Completely confidential visits where we evaluate the customer experience and how staff interact with customers.",
          description:
            "Our Mystery Shopping service sends trained, confidential evaluators into your branches as real customers. We assess every touchpoint — from the first greeting to the final interaction — and give you an honest, documented picture of what your customers actually experience.",
          highlights: [
            "Fully confidential, unannounced visits by trained evaluators",
            "Structured evaluation of staff interaction and service quality",
            "Detailed, documented reports after every visit",
            "Repeatable visits to track improvement over time",
          ],
        },
        "managed-services": {
          title: "Managed Services",
          short: "A specialized team in Quality Assurance, Mystery Shopping, and Auditing to manage your company's quality operations.",
          description:
            "Through our Managed Quality Services, we embed a specialized team — covering Quality Assurance, Mystery Shopping, and Auditing — directly into your operation, for renewable periods. It's a fully outsourced quality department, without the overhead of building one in-house.",
          highlights: [
            "A dedicated, specialized quality team assigned to your business",
            "Covers QA, Mystery Shopping, and Auditing under one contract",
            "Renewable engagement periods that scale with your needs",
            "Consistent oversight across all branches and locations",
          ],
        },
        "auditing-visits": {
          title: "Auditing Visits",
          short: "Surprise quality inspection visits, with authorization from the company or branch, covering products and facilities.",
          description:
            "Our Auditing Visits are surprise quality inspections carried out with prior authorization from the company or branch. We check all products, inspect the facility, and make sure everything meets the required quality standards — so issues are caught before your customers ever see them.",
          highlights: [
            "Authorized, surprise inspection visits",
            "Full product and facility quality checks",
            "Verification against required quality standards",
            "Clear, actionable findings after every audit",
          ],
        },
        "customer-experience": {
          title: "Customer Experience (CX)",
          short: "End-to-end customer experience design and measurement, turning findings into real improvements customers can feel.",
          description:
            "Our Customer Experience service goes beyond a single visit or audit. We study the full customer journey across your branches, measure satisfaction, and translate every finding into a practical action plan — helping your business compete and grow through the experience it delivers.",
          highlights: [
            "End-to-end customer journey mapping across branches",
            "Satisfaction measurement and CX benchmarking",
            "Actionable improvement plans, not just reports",
            "Ongoing tracking to make sure changes actually stick",
          ],
        },
      },
    },
    ar: {
      pageBadge: "خدماتنا",
      pageTitle: "أربع طرق نساعدك بيها تشوف، وتحسّن، تجربة عملائك.",
      pageIntro:
        "من زيارة سرية واحدة لغاية قسم جودة مُدار بالكامل، كل خدمة مصممة تحول تجربة العميل الحقيقية لدليل، والدليل لخطوات فعلية.",
      seeHowItWorks: "اعرف تفاصيل الخدمة",
      allServices: "كل الخدمات",
      howItWorks: "طريقة العمل",
      askAboutService: "اسأل عن هذه الخدمة",
      whatsIncluded: "المتضمّن في الخدمة",
      otherServices: "خدمات أخرى",
      learnMore: "اعرف أكتر ←",
      items: {
        "mystery-shopping": {
          title: "زيارات تسوق سري",
          short: "زيارات سرية بالكامل نقيّم فيها تجربة العميل وطريقة تعامل الموظفين مع العملاء.",
          description:
            "خدمة التسوق السري بتاعتنا بتبعت مقيّمين مدرّبين وسريين لفروعك كعملاء حقيقيين. بنقيّم كل نقطة تفاعل — من أول ترحيب لحد آخر تفاعل — ونديك صورة صادقة وموثقة لتجربة عملائك الحقيقية.",
          highlights: [
            "زيارات سرية غير معلنة من مقيّمين مدربين",
            "تقييم منظم لتفاعل الموظفين وجودة الخدمة",
            "تقارير موثقة تفصيلية بعد كل زيارة",
            "زيارات متكررة لمتابعة التحسن مع الوقت",
          ],
        },
        "managed-services": {
          title: "خدمات مُدارة",
          short: "فريق متخصص في ضبط الجودة والتسوق السري والتدقيق لإدارة عمليات الجودة في شركتك.",
          description:
            "من خلال خدمات الجودة المُدارة، بندمج فريق متخصص — يغطي ضبط الجودة والتسوق السري والتدقيق — مباشرة في تشغيلك، لفترات قابلة للتجديد. قسم جودة كامل من غير عبء بناء واحد داخلي.",
          highlights: [
            "فريق جودة مخصص ومتخصص لشركتك",
            "يغطي QA والتسوق السري والتدقيق في عقد واحد",
            "فترات تعاقد قابلة للتجديد تتناسب مع احتياجك",
            "متابعة مستمرة لكل الفروع والمواقع",
          ],
        },
        "auditing-visits": {
          title: "زيارات تدقيق",
          short: "زيارات تفتيش جودة مفاجئة، بتصريح من الشركة أو الفرع، تغطي المنتجات والمنشآت.",
          description:
            "زيارات التدقيق بتاعتنا هي تفتيشات جودة مفاجئة بتصريح مسبق من الشركة أو الفرع. بنفحص كل المنتجات، نعاين المنشأة، ونتأكد إن كل حاجة مطابقة لمعايير الجودة المطلوبة — عشان المشاكل تتلاحظ قبل ما عملاؤك يشوفوها.",
          highlights: [
            "زيارات تفتيش مفاجئة ومصرّح بها",
            "فحص كامل للمنتجات والمنشآت",
            "التحقق من الالتزام بمعايير الجودة المطلوبة",
            "نتائج واضحة وعملية بعد كل زيارة تدقيق",
          ],
        },
        "customer-experience": {
          title: "تجربة العملاء (CX)",
          short: "تصميم وقياس تجربة العميل من الألف للياء، وتحويل النتائج لتحسينات حقيقية يحسها العميل.",
          description:
            "خدمة تجربة العملاء بتاعتنا أكبر من مجرد زيارة أو تدقيق واحد. بندرس رحلة العميل الكاملة عبر فروعك، نقيس الرضا، ونترجم كل نتيجة لخطة عمل عملية — بنساعد شركتك تنافس وتنمو من خلال التجربة اللي بتقدمها.",
          highlights: [
            "رسم رحلة العميل الكاملة عبر الفروع",
            "قياس الرضا ومقارنة معايير تجربة العملاء",
            "خطط تحسين عملية، مش مجرد تقارير",
            "متابعة مستمرة للتأكد إن التغييرات فعلاً بتستمر",
          ],
        },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────
// resolveServices(doc, language)
//
// بيدمج بيانات كولكشن "services" مع المحتوى الافتراضي فوق، عشان الاسم والوصف
// دايمًا يظهروا حتى لو الداتابيز فيها الخدمة (slug/icon/image) من غير ترجمتها.
//   - items: خدمات الداتابيز (ولو الداتابيز مفيهاش أي خدمات بنستخدم الافتراضي).
//   - tr:    ترجمة اللغة الحالية؛ أي نص موجود في الداتابيز بيغلب الافتراضي،
//            والقيم الفاضية في الداتابيز بتتجاهل.
// ─────────────────────────────────────────────────────────────────────────
const isEmpty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

function overlay(base, over) {
  const out = { ...(base || {}) };
  for (const [k, v] of Object.entries(over || {})) if (!isEmpty(v)) out[k] = v;
  return out;
}

export function resolveServices(doc, language) {
  const fbT = FALLBACK_SERVICES.i18n[language] || FALLBACK_SERVICES.i18n.en;
  const dbT = doc?.i18n?.[language] || doc?.i18n?.en || {};

  const items = doc?.items?.length ? doc.items : FALLBACK_SERVICES.items;

  const textItems = {};
  for (const slug of new Set([...Object.keys(fbT.items || {}), ...Object.keys(dbT.items || {})])) {
    textItems[slug] = overlay(fbT.items?.[slug], dbT.items?.[slug]);
  }

  return { items, tr: { ...overlay(fbT, dbT), items: textItems } };
}
