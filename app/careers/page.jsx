// app/careers/page.jsx
"use client";

import { Briefcase, MapPin, ArrowRight } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../lib/useCollectionData";

// 🔄 DYNAMIC: كانت الوظائف Array ثابتة في lib/data.jsx. دلوقتي جايه من
// كولكشن "careers" (document واحد فيه items[] + i18n لكل وظيفة).
const FALLBACK_CAREERS = {
  contactEmail: "hello@qualx.com",
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
            "Plan and run marketing campaigns across digital and offline channels, grow Qualx's brand presence, and generate qualified leads for our services.",
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
            "تخطيط وتنفيذ حملات تسويقية على القنوات الرقمية والتقليدية، تنمية حضور براند Qualx، وجلب عملاء محتملين لخدماتنا.",
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

export default function CareersPage() {
  const { language } = useLanguage();
  const { data, loading } = useCollectionData("careers");

  if (loading) return <PageLoading />;

  const doc = data || FALLBACK_CAREERS;
  const items = doc.items || [];
  const t = pickTranslation(doc, language) || FALLBACK_CAREERS.i18n.en;
  const contactEmail = doc.contactEmail || FALLBACK_CAREERS.contactEmail;

  return (
    <div>
      <section className="bg-navy text-offwhite">
        <div className="container-content py-20">
          <span className="inline-block rounded-full border border-gold/40 px-3 py-1 text-xs font-medium text-gold">
            {t.badge}
          </span>
          <h1 className="mt-6 max-w-2xl font-display text-4xl font-semibold leading-tight">
            {t.heroTitle}
          </h1>
          <p className="mt-4 max-w-xl text-offwhite/75">{t.heroText}</p>
        </div>
      </section>

      <section className="container-content py-16">
        <h2 className="font-display text-xl font-semibold text-navy">{t.openRolesTitle}</h2>

        <div className="mt-8 space-y-4">
          {items.map((role) => {
            const rt = t.items?.[role.slug] || {};
            return (
              <div
                key={role.slug}
                className="flex flex-col gap-4 rounded-lg border border-charcoal/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-display text-lg font-semibold text-navy">{rt.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-charcoal/60">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={15} className="text-sky" />
                      {rt.type}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={15} className="text-sky" />
                      {rt.location}
                    </span>
                  </div>
                  <p className="mt-3 max-w-xl text-sm text-charcoal/70">{rt.description}</p>
                </div>

                <a
                  href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                    "Application: " + (rt.title || role.slug)
                  )}`}
                  className="btn-primary shrink-0 self-start sm:self-center"
                >
                  {t.applyNow}
                  <ArrowRight size={16} />
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-lg bg-sky/10 p-6 text-sm text-charcoal/70">
          {t.noRoleText}{" "}
          <a href={`mailto:${contactEmail}`} className="font-medium text-sky hover:text-navy">
            {contactEmail}
          </a>{" "}
          {t.noRoleTail}
        </div>
      </section>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
    </div>
  );
}