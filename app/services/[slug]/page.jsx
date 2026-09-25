// app/services/[slug]/page.jsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../../lib/useCollectionData";
import ServiceIcon from "../../components/ServiceIcon";

// 🔄 DYNAMIC: كانت الصفحة دي Server Component بتستخدم generateStaticParams +
// generateMetadata (SSG). بما إن المحتوى بقى ديناميكي 100% من مونجو وبيتقرا
// client-side زي باقي الصفحات، شلنا الاتنين (مش هيشتغلوا أساسًا في client
// component) والصفحة بترندر كل حاجة بعد ما تجيب بيانات كولكشن "services".
export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const { data, loading } = useCollectionData("services");

  if (loading) return <PageLoading />;
  if (!data) return <PageLoading />;

  const items = data.items || [];
  const service = items.find((s) => s.slug === slug);
  const t = pickTranslation(data, language) || {};
  const st = t.items?.[slug];

  if (!service || !st) return <NotFoundState language={language} />;

  const otherServices = items.filter((s) => s.slug !== slug);

  return (
    <div>
      <section className="bg-navy text-offwhite">
        <div className="container-content py-20">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm text-offwhite/70 hover:text-gold"
          >
            <ArrowLeft size={14} />
            {t.allServices || "All services"}
          </Link>

          <div className="mt-6 flex h-14 w-14 items-center justify-center rounded bg-gold text-navy">
            <ServiceIcon name={service.icon} size={26} />
          </div>

          <h1 className="mt-6 max-w-2xl font-display text-4xl font-semibold leading-tight">
            {st.title}
          </h1>
          <p className="mt-4 max-w-xl text-offwhite/75">{st.short}</p>
        </div>
      </section>

      <section className="container-content grid gap-12 py-16 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="font-display text-xl font-semibold text-navy">
            {t.howItWorks || "How it works"}
          </h2>
          <p className="mt-4 leading-relaxed text-charcoal/80">{st.description}</p>

          <Link href="/services" className="btn-primary mt-8">
            {t.askAboutService || "Ask about this service"}
            <ArrowRight size={16} />
          </Link>
        </div>

        <div>
          <div className="rounded-lg border border-charcoal/10 bg-white p-6">
            <h3 className="font-display text-base font-semibold text-navy">
              {t.whatsIncluded || "What's included"}
            </h3>
            <ul className="mt-4 space-y-3">
              {(st.highlights || []).map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-charcoal/75">
                  <Check size={16} className="mt-0.5 shrink-0 text-sky" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-charcoal/10 bg-white">
        <div className="container-content py-16">
          <h2 className="font-display text-xl font-semibold text-navy">
            {t.otherServices || "Other services"}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {otherServices.map((s) => {
              const ost = t.items?.[s.slug] || {};
              return (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="group rounded-lg border border-charcoal/10 p-5 transition-colors hover:border-sky"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-navy text-gold">
                    <ServiceIcon name={s.icon} size={18} />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-navy">
                    {ost.title}
                  </h3>
                  <span className="mt-2 inline-block text-sm font-medium text-sky group-hover:text-navy">
                    {t.learnMore || "Learn more →"}
                  </span>
                </Link>
              );
            })}
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

function NotFoundState({ language }) {
  const isAr = language === "ar";
  return (
    <div className="container-content flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-2xl font-semibold text-navy">
        {isAr ? "الخدمة غير موجودة" : "Service not found"}
      </h1>
      <Link href="/services" className="btn-primary">
        {isAr ? "كل الخدمات" : "All services"}
      </Link>
    </div>
  );
}