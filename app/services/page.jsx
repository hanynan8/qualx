// app/services/page.jsx
"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../lib/useCollectionData";
import ServiceIcon from "../components/ServiceIcon";
import ServiceVisual from "../components/ServiceVisual";
import PageHero from "../components/PageHero";

// 🔄 DYNAMIC: كانت الميتاداتا (title/description) static export من السيرفر —
// دلوقتي الصفحة client component، فمفيش export const metadata هنا (Next
// بيتجاهله في client components أساسًا). العنوان بيتحط في <title> عن طريق
// document.title في useEffect بسيط، والوصف مش SEO-critical لصفحة داخلية.
const FALLBACK_SERVICES = {
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
      items: {
        "mystery-shopping": {
          title: "Mystery Shopping Visits",
          short: "Completely confidential visits where we evaluate the customer experience and how staff interact with customers.",
        },
        "managed-services": {
          title: "Managed Services",
          short: "A specialized team in Quality Assurance, Mystery Shopping, and Auditing to manage your company's quality operations.",
        },
        "auditing-visits": {
          title: "Auditing Visits",
          short: "Surprise quality inspection visits, with authorization from the company or branch, covering products and facilities.",
        },
        "customer-experience": {
          title: "Customer Experience (CX)",
          short: "End-to-end customer experience design and measurement, turning findings into real improvements customers can feel.",
        },
      },
    },
    ar: {
      pageBadge: "خدماتنا",
      pageTitle: "أربع طرق نساعدك بيها تشوف، وتحسّن، تجربة عملائك.",
      pageIntro:
        "من زيارة سرية واحدة لغاية قسم جودة مُدار بالكامل، كل خدمة مصممة تحول تجربة العميل الحقيقية لدليل، والدليل لخطوات فعلية.",
      seeHowItWorks: "اعرف تفاصيل الخدمة",
      items: {
        "mystery-shopping": {
          title: "زيارات تسوق سري",
          short: "زيارات سرية بالكامل نقيّم فيها تجربة العميل وطريقة تعامل الموظفين مع العملاء.",
        },
        "managed-services": {
          title: "خدمات مُدارة",
          short: "فريق متخصص في ضبط الجودة والتسوق السري والتدقيق لإدارة عمليات الجودة في شركتك.",
        },
        "auditing-visits": {
          title: "زيارات تدقيق",
          short: "زيارات تفتيش جودة مفاجئة، بتصريح من الشركة أو الفرع، تغطي المنتجات والمنشآت.",
        },
        "customer-experience": {
          title: "تجربة العملاء (CX)",
          short: "تصميم وقياس تجربة العميل من الألف للياء، وتحويل النتائج لتحسينات حقيقية يحسها العميل.",
        },
      },
    },
  },
};

export default function ServicesPage() {
  const { language } = useLanguage();
  const { data, loading } = useCollectionData("services");

  if (loading) return <PageLoading />;

  const doc = data || FALLBACK_SERVICES;
  const items = doc.items || [];
  const t = pickTranslation(doc, language) || FALLBACK_SERVICES.i18n.en;

  return (
    <div>
      <PageHero badge={t.pageBadge} title={t.pageTitle} text={t.pageIntro}>
        {/* أيقونات الخدمات كـ pills سريعة */}
        <div className="mt-8 flex flex-wrap gap-3">
          {items.map((service) => (
            <a
              key={service.slug}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-offwhite/85 transition-colors hover:border-gold/60 hover:text-gold"
            >
              <ServiceIcon name={service.icon} size={16} />
              {t.items?.[service.slug]?.title}
            </a>
          ))}
        </div>
      </PageHero>

      {/* Services: صف لكل خدمة (صورة + شرح) بالتبادل */}
      <section className="container-content space-y-20 py-16 md:space-y-28 md:py-24">
        {items.map((service, i) => {
          const st = t.items?.[service.slug] || {};
          const reversed = i % 2 === 1;
          const highlights = (st.highlights || []).slice(0, 3);

          return (
            <article
              key={service.slug}
              id={service.slug}
              className="svc-rise grid scroll-mt-24 items-center gap-10 md:grid-cols-2 md:gap-16"
            >
              <div className={`relative ${reversed ? "md:order-2" : ""}`}>
                <div
                  aria-hidden
                  className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-gold/30 to-sky/30 blur-xl"
                />
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-navy/25">
                  <ServiceVisual
                    slug={service.slug}
                    image={service.image}
                    alt={st.title}
                    className="h-full w-full"
                  />
                </div>
                <span className="absolute -bottom-5 start-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gold text-navy shadow-lg">
                  <ServiceIcon name={service.icon} size={22} />
                </span>
              </div>

              <div className={reversed ? "md:order-1" : ""}>
                <span className="font-display text-6xl font-bold leading-none text-navy/10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-3 font-display text-2xl font-semibold text-navy md:text-3xl">
                  {st.title}
                </h2>
                <p className="mt-3 leading-relaxed text-charcoal/75">{st.short}</p>

                {highlights.length > 0 && (
                  <ul className="mt-6 space-y-2.5">
                    {highlights.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-charcoal/80">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky">
                          <Check size={12} strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                <Link href={`/services/${service.slug}`} className="btn-primary group mt-8">
                  {t.seeHowItWorks}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                  />
                </Link>
              </div>
            </article>
          );
        })}
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