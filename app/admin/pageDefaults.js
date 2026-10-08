// app/admin/pageDefaults.js
//
// نسخة نصية (من غير الأيقونات) من نصوص PAGE الثابتة في كود الصفحات
// (solutions / careers / about). بتُستخدم في لوحة الأدمن بس كقالب: زرار
// "تحميل نصوص الصفحة" بيحط النصوص دي في doc.i18n.<lang>.page عشان الأدمن
// يعدّلها، والصفحات بتدمجها فوق نصوص الكود عن طريق mergePageText().
//
// ⚠️ ده ملف مولَّد من الصفحات نفسها؛ لو غيّرت PAGE في صفحة، حدّث النسخة هنا.

export const PAGE_DEFAULTS = {
  "about": {
    "en": {
      "pageTitle": "About us",
      "explore": "Explore our services",
      "contact": "Get in touch",
      "ctaTitle": "Ready to see your business through your customers' eyes?",
      "ctaSubtitle": "Tell us about your branches — we'll put together a plan."
    },
    "ar": {
      "pageTitle": "من نحن",
      "explore": "استكشف خدماتنا",
      "contact": "تواصل معانا",
      "ctaTitle": "جاهز تشوف شركتك بعين عملائك؟",
      "ctaSubtitle": "احكيلنا عن فروعك — هنجهزلك خطة."
    }
  },
  "services": {
    "en": {
      "heroTitle": "Our Solutions",
      "heroCta": "Get a quote",
      "introTitle": "Merlix delivers a full range of quality Solutions to help businesses reach their true potential.",
      "introText": "Through a comprehensive approach, we help our clients evaluate the customer experience, keep quality standards consistent across every branch, and turn documented findings into real improvements, building customer loyalty while growing sales and profits.",
      "videoTitle": "Contact us today!",
      "videoText": "We can help you choose the perfect combination of Solutions to maximize your ROI.",
      "playLabel": "Play video",
      "suiteSuffix": "Suite",
      "viewSuite": "View service",
      "suites": {
        "mystery-shopping": {
          "name": "Mystery Shopping",
          "tagline": "Want to know what customers really see? We'll visit and tell you.",
          "subs": [
            {
              "label": "Confidential Visits"
            },
            {
              "label": "Staff Interaction"
            },
            {
              "label": "Documented Reports"
            }
          ]
        },
        "auditing-visits": {
          "name": "Operational Audit",
          "tagline": "If it has to be done right, we've got your back!",
          "subs": [
            {
              "label": "Surprise Inspections"
            },
            {
              "label": "Standards Checklists"
            },
            {
              "label": "Facility & Products"
            }
          ]
        },
        "customer-experience": {
          "name": "Customer Experience",
          "tagline": "Satisfaction, journeys, benchmarking... it's all there!",
          "subs": [
            {
              "label": "Journey Mapping"
            },
            {
              "label": "Satisfaction Surveys"
            },
            {
              "label": "Improvement Plans"
            }
          ]
        }
      },
      "managedTitle": "Managed Solutions",
      "managedTagline": "Need a whole quality department? We've got it!",
      "managedSubs": [
        {
          "label": "Quality Assurance"
        },
        {
          "label": "Mystery Shopping"
        },
        {
          "label": "Auditing"
        },
        {
          "label": "Reporting & Tracking"
        }
      ],
      "platformTitle": "Merlix Reporting",
      "platformSub": "PLATFORM",
      "platformText": "Every service feeds into one clear, documented reporting flow, so you always see where each branch stands and what to fix first.",
      "demoTitle": "Let us show you how we generate real value for our clients.",
      "demoText": "We can help you choose the perfect combination of Solutions to maximize your ability to raise quality and customer satisfaction across all your branches.",
      "demoStrong": "Spend smart, improve more. Win-win!",
      "demoCta": "Get a quote",
      "dashTitle": "Branch score",
      "dashSub": "Last 6 visits"
    },
    "ar": {
      "heroTitle": "خدماتنا",
      "heroCta": "اطلب عرض سعر",
      "introTitle": "كواليكس بتقدم مجموعة كاملة من خدمات الجودة عشان تساعد شركتك توصل لأقصى إمكانياتها.",
      "introText": "من خلال نهج متكامل، بنساعد عملاءنا يقيّموا تجربة العميل، ويحافظوا على معايير الجودة موحّدة في كل الفروع، ويحوّلوا النتائج الموثقة لتحسينات حقيقية، وبكده يبنوا ولاء العملاء وتزيد المبيعات والأرباح.",
      "videoTitle": "تواصل معانا النهارده!",
      "videoText": "نقدر نساعدك تختار التوليفة المثالية من الخدمات عشان تحقق أعلى عائد.",
      "playLabel": "شغّل الفيديو",
      "suiteSuffix": "",
      "viewSuite": "اعرف تفاصيل الخدمة",
      "suites": {
        "mystery-shopping": {
          "name": "التسوق السري",
          "tagline": "عايز تعرف العميل بيشوف إيه فعلًا؟ إحنا نزور ونقولك.",
          "subs": [
            {
              "label": "زيارات سرية"
            },
            {
              "label": "تعامل الموظفين"
            },
            {
              "label": "تقارير موثقة"
            }
          ]
        },
        "auditing-visits": {
          "name": "التدقيق التشغيلي",
          "tagline": "لو لازم يتعمل صح، إحنا وراك!",
          "subs": [
            {
              "label": "تفتيش مفاجئ"
            },
            {
              "label": "قوائم معايير الجودة"
            },
            {
              "label": "المنشأة والمنتجات"
            }
          ]
        },
        "customer-experience": {
          "name": "تجربة العملاء",
          "tagline": "رضا العملاء، رحلة العميل، المقارنات... كله موجود!",
          "subs": [
            {
              "label": "خريطة رحلة العميل"
            },
            {
              "label": "استطلاعات الرضا"
            },
            {
              "label": "خطط التحسين"
            }
          ]
        }
      },
      "managedTitle": "الخدمات المُدارة",
      "managedTagline": "محتاج قسم جودة كامل؟ عندنا!",
      "managedSubs": [
        {
          "label": "ضبط الجودة"
        },
        {
          "label": "التسوق السري"
        },
        {
          "label": "التدقيق"
        },
        {
          "label": "التقارير والمتابعة"
        }
      ],
      "platformTitle": "تقارير كواليكس",
      "platformSub": "PLATFORM",
      "platformText": "كل خدماتنا بتصب في مسار تقارير واحد واضح وموثق، عشان تشوف دايمًا وضع كل فرع وإيه أول حاجة تتصلح.",
      "demoTitle": "خلّينا نوريك إزاي بنحقق قيمة حقيقية لعملائنا.",
      "demoText": "نقدر نساعدك تختار التوليفة المثالية من الخدمات عشان ترفع الجودة ورضا العملاء في كل فروعك.",
      "demoStrong": "اصرف بذكاء، وحسّن أكتر. مكسب للطرفين!",
      "demoCta": "اطلب عرض سعر",
      "dashTitle": "تقييم الفرع",
      "dashSub": "آخر ٦ زيارات"
    }
  },
  "careers": {
    "en": {
      "heroCta": "View open roles",
      "perks": [
        {
          "text": "Work on real projects across Egypt"
        },
        {
          "text": "Grow your skills inside a hands-on quality team"
        },
        {
          "text": "A small, friendly team that values the details you notice"
        }
      ],
      "hiringTitle": "How we hire",
      "hiringSteps": [
        {
          "title": "Apply",
          "text": "Send your CV and tell us where you'd add value."
        },
        {
          "title": "Review",
          "text": "We review your profile against the role."
        },
        {
          "title": "Conversation",
          "text": "A short chat so we get to know you."
        },
        {
          "title": "Join",
          "text": "Start with onboarding and your first assignment."
        }
      ],
      "ctaButton": "Send your CV",
      "empty": "No open roles right now, but we'd still love to hear from you."
    },
    "ar": {
      "heroCta": "شوف الوظائف المتاحة",
      "perks": [
        {
          "text": "اشتغل على مشاريع حقيقية في كل مصر"
        },
        {
          "text": "طوّر مهاراتك جوه فريق جودة شغال ميداني"
        },
        {
          "text": "فريق صغير وودود بيقدّر التفاصيل اللي بتلاحظها"
        }
      ],
      "hiringTitle": "بنوظّف إزاي",
      "hiringSteps": [
        {
          "title": "قدّم",
          "text": "ابعت سيرتك الذاتية وقولنا فين ممكن تضيف قيمة."
        },
        {
          "title": "مراجعة",
          "text": "بنراجع ملفك على متطلبات الوظيفة."
        },
        {
          "title": "محادثة",
          "text": "لقاء قصير عشان نتعرف عليك."
        },
        {
          "title": "انضم",
          "text": "بتبدأ بالتعريف بالشغل وأول مهمة ليك."
        }
      ],
      "ctaButton": "ابعت سيرتك الذاتية",
      "empty": "مفيش وظايف متاحة دلوقتي، بس لسه حابين نسمع منك."
    }
  }
};
