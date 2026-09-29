// app/services/[slug]/page.jsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../../lib/useCollectionData";
import ServiceIcon from "../../components/ServiceIcon";
import ServiceVisual from "../../components/ServiceVisual";
import PageHero from "../../components/PageHero";

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
      <PageHero
        back={
          <Link
            href="/services"
            className="mb-6 inline-flex items-center gap-2 text-sm text-offwhite/70 transition-colors hover:text-gold"
          >
            <ArrowLeft size={14} className="rtl:rotate-180" />
            {t.allServices || "All services"}
          </Link>
        }
        icon={<ServiceIcon name={service.icon} size={26} />}
        title={st.title}
        text={st.short}
        visual={
          <>
            <div aria-hidden className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-gold/30 to-sky/30 blur-xl" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/30">
              <ServiceVisual slug={service.slug} image={service.image} alt={st.title} className="h-full w-full" />
            </div>
          </>
        }
      />

      <section className="container-content grid gap-12 py-16 md:grid-cols-3 md:py-24">
        <div className="md:col-span-2">
          <h2 className="font-display text-3xl font-bold text-navy">
            {t.howItWorks || "How it works"}
          </h2>
          <span className="mt-4 block h-1 w-14 rounded-full bg-gold" />
          <p className="mt-6 text-base leading-loose text-charcoal/80 md:text-lg">{st.description}</p>

          <Link href="/services" className="btn-primary group mt-8">
            {t.askAboutService || "Ask about this service"}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>

        <div>
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-lg shadow-navy/5 md:sticky md:top-24">
            <h3 className="font-display text-lg font-semibold text-navy">
              {t.whatsIncluded || "What's included"}
            </h3>
            <ul className="mt-5 space-y-4">
              {(st.highlights || []).map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-charcoal/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-charcoal/10 bg-gradient-to-b from-white to-offwhite">
        <div className="container-content py-16 md:py-20">
          <h2 className="font-display text-3xl font-bold text-navy">
            {t.otherServices || "Other services"}
          </h2>
          <span className="mt-4 block h-1 w-14 rounded-full bg-gold" />

          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {otherServices.map((s2, i) => {
              const ost = t.items?.[s2.slug] || {};
              return (
                <Link
                  key={s2.slug}
                  href={`/services/${s2.slug}`}
                  style={{ animationDelay: `${i * 90}ms` }}
                  className="svc-rise group overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-sky/40 hover:shadow-2xl hover:shadow-navy/15"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-navy">
                    <ServiceVisual
                      slug={s2.slug}
                      image={s2.image}
                      alt={ost.title}
                      className="h-full w-full transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-navy">
                        <ServiceIcon name={s2.icon} size={18} />
                      </span>
                      <h3 className="font-display text-base font-semibold text-navy">{ost.title}</h3>
                    </div>
                    <ArrowRight size={18} className="shrink-0 text-sky transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </div>
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