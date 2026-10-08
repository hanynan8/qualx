// scripts/seed.mjs
//
// سكريبت seed بسيط: بيحط الـ document الأولي لكل كولكشن من الـ 5 كولكشنز
// (home, services, careers, navbar, footer) في مونجو، بنفس المحتوى اللي
// كان static قبل كده في lib/data.jsx + ترجمة عربي مقابلة.
//
// طريقة التشغيل:
//   1) تأكد إن متغير البيئة اسمه نفس اللي بتستخدمه فعليًا في
//      app/lib/mongodb.js (هنا مكتوب MONGODB_URI — لو عندك اسم مختلف
//      زي MONGO_URI بدّله في السطر اللي فيه process.env تحت).
//   2) شغّل: node scripts/seed.mjs
//
// ⚠️ السكريبت ده بيعمل upsert (لو الكولكشن فيه document بالفعل مش هيكرره
// أو يمسحه، هيحدّثه). آمن تشغله أكتر من مرة.

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("❌ حط رابط الداتابيز في متغير البيئة MONGODB_URI (أو MONGO_URI) الأول.");
  process.exit(1);
}

const schema = new mongoose.Schema({}, { strict: false, timestamps: true });

function modelFor(name) {
  const modelName = `Seed_${name}`;
  return mongoose.models[modelName] || mongoose.model(modelName, schema, name);
}

// ───────────────────────────── home ─────────────────────────────
const homeDoc = {
  cardIcons: ["shield", "users", "clipboard"],
  i18n: {
    en: {
      badge: "Mystery Shopping · Auditing · CX",
      heroTitle: "See your business the way your customers actually see it.",
      heroSummary:
        "Merlix is a company specialized in evaluating customer experience and quality control (Mystery Shopping & QA) for businesses and branches across Egypt, through confidential evaluation visits and documented reports. We also provide fully equipped quality staff for your location and deliver real, actionable solutions to help your business grow.",
      exploreServices: "Explore our services",
      joinTeam: "Join our team",
      cards: {
        shield: "Confidential, structured evaluation visits across Egypt",
        users: "A dedicated quality team, embedded in your operation",
        clipboard: "Documented findings turned into real, actionable plans",
      },
      uspLabel: "USP",
      uspText: "Built from a real understanding of the Egyptian market",
      whoWeAreTitle: "Who we are",
      whatWeDoTitle: "What we do",
      viewAllServices: "View all services →",
      learnMore: "Learn more →",
      ctaTitle: "Ready to see your business through your customers' eyes?",
      ctaSubtitle: "Tell us about your branches — we'll put together a plan.",
      ctaButton: "Get in touch",
    },
    ar: {
      badge: "تسوق سري · تدقيق · تجربة عملاء",
      heroTitle: "شوف شركتك بعين عملائك فعليًا.",
      heroSummary:
        "كواليكس شركة متخصصة في تقييم تجربة العملاء وضبط الجودة (Mystery Shopping & QA) للشركات والفروع في مصر، من خلال زيارات تقييم سرية وتقارير موثقة. كمان بنوفر فريق جودة جاهز لموقعك ونقدم حلول عملية فعلية تساعد شركتك تنمو.",
      exploreServices: "استكشف خدماتنا",
      joinTeam: "انضم لفريقنا",
      cards: {
        shield: "زيارات تقييم سرية ومنظمة في كل مصر",
        users: "فريق جودة مخصص، مندمج في تشغيلك",
        clipboard: "نتائج موثقة تتحول لخطط عملية فعلية",
      },
      uspLabel: "ميزتنا",
      uspText: "مبني على فهم حقيقي للسوق المصري",
      whoWeAreTitle: "مين إحنا",
      whatWeDoTitle: "بنعمل إيه",
      viewAllServices: "عرض كل الخدمات ←",
      learnMore: "اعرف أكتر ←",
      ctaTitle: "جاهز تشوف شركتك بعين عملائك؟",
      ctaSubtitle: "احكيلنا عن فروعك — هنجهزلك خطة.",
      ctaButton: "تواصل معانا",
    },
  },
};

// ─────────────────────────── services ───────────────────────────
const servicesDoc = {
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

// ──────────────────────────── careers ───────────────────────────
const careersDoc = {
  contactEmail: "hello@merlix.com",
  items: [
    { slug: "marketing" },
    { slug: "mystery-shopper" },
    { slug: "auditor" },
    { slug: "advisor" },
    { slug: "quality-validation" },
  ],
  i18n: {
    en: {
      badge: "Careers",
      heroTitle: "Help businesses see themselves the way their customers do.",
      heroText:
        "We're a small, sharp team working across Egypt on Mystery Shopping, Auditing, and Customer Experience. If you notice details other people miss, we'd like to hear from you.",
      openRolesTitle: "Open roles",
      applyNow: "Apply now",
      noRoleText: "Don't see a role that fits? Send your CV to",
      noRoleTail: "and tell us where you'd add the most value.",
      items: {
        "marketing": {
          title: "Marketing Specialist",
          type: "Full-time",
          location: "Cairo, Egypt",
          description:
            "Plan and run marketing campaigns across digital and offline channels, grow Merlix's brand presence, and generate qualified leads for our services.",
        },
        "mystery-shopper": {
          title: "Mystery Shopper (MS)",
          type: "Freelance / Part-time",
          location: "Cairo & branches across Egypt",
          description:
            "Visit assigned locations as a regular customer, evaluate the experience against a structured checklist, and submit a detailed, honest report after every visit.",
        },
        "auditor": {
          title: "Auditor",
          type: "Full-time",
          location: "Cairo, Egypt",
          description:
            "Carry out authorized facility and product inspections, verify compliance with quality standards, and document findings clearly for our clients.",
        },
        "advisor": {
          title: "Advisor",
          type: "Full-time",
          location: "Cairo, Egypt",
          description:
            "Turn audit and visit findings into practical recommendations, and advise clients on improving service quality, processes, and customer experience.",
        },
        "quality-validation": {
          title: "Quality Validation Specialist",
          type: "Full-time",
          location: "Cairo, Egypt",
          description:
            "Review and validate field reports and collected data for accuracy and consistency, and make sure every deliverable meets our quality standards before it reaches the client.",
        },
      },
    },
    ar: {
      badge: "وظائف",
      heroTitle: "ساعد الشركات تشوف نفسها بعين عملائها.",
      heroText:
        "إحنا فريق صغير ومركّز شغال في كل مصر على التسوق السري، التدقيق، وتجربة العملاء. لو بتلاحظ تفاصيل الناس التانية بتفوتها، حابين نسمع منك.",
      openRolesTitle: "الوظائف المتاحة",
      applyNow: "قدّم دلوقتي",
      noRoleText: "مش لاقي وظيفة تناسبك؟ ابعت السيرة الذاتية على",
      noRoleTail: "وقولنا فين ممكن تضيف قيمة أكتر.",
      items: {
        "marketing": {
          title: "أخصائي تسويق",
          type: "دوام كامل",
          location: "القاهرة، مصر",
          description:
            "تخطيط وتنفيذ حملات تسويقية على القنوات الرقمية والتقليدية، تنمية حضور براند Merlix وجلب عملاء محتملين لخدماتنا.",
        },
        "mystery-shopper": {
          title: "متسوق سري (MS)",
          type: "فريلانس / بارت تايم",
          location: "القاهرة وفروع في كل مصر",
          description:
            "زيارة الأماكن المحددة كعميل عادي، تقييم التجربة حسب checklist منظم، وتسليم تقرير تفصيلي وصادق بعد كل زيارة.",
        },
        "auditor": {
          title: "مدقق (Auditor)",
          type: "دوام كامل",
          location: "القاهرة، مصر",
          description:
            "تنفيذ تفتيش مصرّح به للمنشآت والمنتجات، التأكد من الالتزام بمعايير الجودة، وتوثيق النتائج بوضوح لعملائنا.",
        },
        "advisor": {
          title: "مستشار (Advisor)",
          type: "دوام كامل",
          location: "القاهرة، مصر",
          description:
            "تحويل نتائج التدقيق والزيارات لتوصيات عملية، ونصح العملاء في تحسين جودة الخدمة والإجراءات وتجربة العملاء.",
        },
        "quality-validation": {
          title: "أخصائي مراجعة الجودة (Quality Validation)",
          type: "دوام كامل",
          location: "القاهرة، مصر",
          description:
            "مراجعة تقارير الزيارات والبيانات المُجمّعة والتأكد من دقتها وتناسقها، وضمان مطابقة كل تسليمة لمعايير الجودة قبل وصولها للعميل.",
        },
      },
    },
  },
};

// ──────────────────────────── navbar ────────────────────────────
const navbarDoc = {
  brandLetter: "Q",
  links: [
    { id: "home", href: "/" },
    { id: "services", href: "/services" },
    { id: "careers", href: "/careers" },
  ],
  i18n: {
    en: { brand: "Merlix", links: { home: "Home", services: "Services", careers: "Careers" }, quote: "Get a quote" },
    ar: { brand: "Merlix", links: { home: "الرئيسية", services: "خدماتنا", careers: "وظائف" }, quote: "اطلب عرض سعر" },
  },
};

// ──────────────────────────── footer ────────────────────────────
const footerDoc = {
  brandLetter: "Q",
  links: [
    { id: "home", href: "/" },
    { id: "services", href: "/services" },
    { id: "careers", href: "/careers" },
  ],
  contact: {
    email: "hello@merlix.com",
    phone: "+20 100 000 0000",
    location: "Cairo, Egypt",
  },
  i18n: {
    en: {
      brand: "Merlix",
      description:
        "Quality Assurance & Customer Experience for businesses and branches across Egypt — Mystery Shopping, Auditing, Managed Services, and CX.",
      companyTitle: "Company",
      contactTitle: "Contact",
      links: { home: "Home", services: "Services", careers: "Careers" },
    },
    ar: {
      brand: "Merlix",
      description:
        "ضمان جودة وتجربة عملاء للشركات والفروع في مصر — تسوق سري، زيارات تدقيق، خدمات مُدارة، وتجربة عملاء.",
      companyTitle: "الشركة",
      contactTitle: "تواصل",
      links: { home: "الرئيسية", services: "خدماتنا", careers: "وظائف" },
    },
  },
};

async function upsertSingleton(collectionName, doc) {
  const Model = modelFor(collectionName);
  const existing = await Model.findOne({});
  if (existing) {
    await Model.findByIdAndUpdate(existing._id, { ...doc, updatedAt: new Date() });
    console.log(`↻ updated existing "${collectionName}" document`);
  } else {
    await Model.create({ ...doc, createdAt: new Date(), updatedAt: new Date() });
    console.log(`+ created "${collectionName}" document`);
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✓ connected to MongoDB");

  await upsertSingleton("home", homeDoc);
  await upsertSingleton("services", servicesDoc);
  await upsertSingleton("careers", careersDoc);
  await upsertSingleton("navbar", navbarDoc);
  await upsertSingleton("footer", footerDoc);

  console.log("✅ seed finished");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ seed failed:", err);
  process.exit(1);
});
