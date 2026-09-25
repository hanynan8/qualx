// app/services/page.jsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../lib/useCollectionData";
import ServiceIcon from "../components/ServiceIcon";

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
      <section className="bg-navy text-offwhite">
        <div className="container-content py-20">
          <span className="inline-block rounded-full border border-gold/40 px-3 py-1 text-xs font-medium text-gold">
            {t.pageBadge}
          </span>
          <h1 className="mt-6 max-w-2xl font-display text-4xl font-semibold leading-tight">
            {t.pageTitle}
          </h1>
          <p className="mt-4 max-w-xl text-offwhite/75">{t.pageIntro}</p>
        </div>
      </section>

      <section className="container-content py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {items.map((service) => {
            const st = t.items?.[service.slug] || {};
            return (
              <div
                key={service.slug}
                className="flex flex-col rounded-lg border border-charcoal/10 bg-white p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded bg-navy text-gold">
                  <ServiceIcon name={service.icon} size={24} />
                </div>
                <h2 className="mt-6 font-display text-xl font-semibold text-navy">{st.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/70">{st.short}</p>
                <Link
                  href={`/services/${service.slug}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky hover:text-navy"
                >
                  {t.seeHowItWorks}
                  <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
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