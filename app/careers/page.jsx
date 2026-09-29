// app/careers/page.jsx
"use client";

import { Briefcase, MapPin, ArrowRight, Clock, Mail } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../lib/useCollectionData";
import PageHero from "../components/PageHero";

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
      <PageHero badge={t.badge} title={t.heroTitle} text={t.heroText} />

      <section className="container-content py-16 md:py-24">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-3xl font-bold text-navy">{t.openRolesTitle}</h2>
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">{items.length}</span>
        </div>
        <span className="mt-4 block h-1 w-14 rounded-full bg-gold" />

        <div className="mt-10 space-y-5">
          {items.map((role, i) => {
            const rt = t.items?.[role.slug] || {};
            return (
              <article
                key={role.slug}
                style={{ animationDelay: `${i * 80}ms` }}
                className="svc-rise group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky/40 hover:shadow-xl hover:shadow-navy/10 sm:flex-row sm:items-center sm:justify-between md:p-8"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-gold to-sky opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />

                <div className="flex gap-5">
                  <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-navy sm:flex">
                    <Briefcase size={24} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-navy">{rt.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-navy">
                        <Clock size={13} className="text-sky" />
                        {rt.type}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-navy">
                        <MapPin size={13} className="text-gold" />
                        {rt.location}
                      </span>
                    </div>
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-charcoal/70">{rt.description}</p>
                  </div>
                </div>

                <a
                  href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                    "Application: " + (rt.title || role.slug)
                  )}`}
                  className="btn-primary group/btn shrink-0 self-start sm:self-center"
                >
                  {t.applyNow}
                  <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1 rtl:rotate-180 rtl:group-hover/btn:-translate-x-1" />
                </a>
              </article>
            );
          })}
        </div>

        <div className="relative mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-[#15406E] p-8 text-offwhite shadow-xl shadow-navy/15 md:p-10">
          <div aria-hidden className="pointer-events-none absolute -top-16 end-[-2rem] h-52 w-52 rounded-full bg-sky/25 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold text-navy">
              <Mail size={24} />
            </span>
            <p className="text-sm leading-relaxed text-offwhite/80 md:text-base">
              {t.noRoleText}{" "}
              <a href={`mailto:${contactEmail}`} className="font-semibold text-gold hover:underline" dir="ltr">
                {contactEmail}
              </a>{" "}
              {t.noRoleTail}
            </p>
          </div>
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