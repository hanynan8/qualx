// app/page.jsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "./lib/useCollectionData";
import ServiceIcon from "./components/ServiceIcon";
import ServiceVisual from "./components/ServiceVisual";
import { IMAGES } from "./lib/siteImages";

// 🔄 DYNAMIC: الصفحة بقت client component وبتجيب محتواها من كولكشنين:
// "home" (نصوص الهيرو/الأقسام) و"services" (كروت المعاينة أسفل الصفحة،
// نفس المصدر اللي بتستخدمه صفحة /services). لحد ما الكولكشنات تتعمل
// seed، بنعرض FALLBACK بنفس محتوى الموقع الحالي عشان الصفحة متبقاش فاضية.
const FALLBACK_HOME = {
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

export default function HomePage() {
  const { language } = useLanguage();
  const home = useCollectionData("home");
  const services = useCollectionData("services");

  if (home.loading || services.loading) return <PageLoading />;

  const homeDoc = home.data || FALLBACK_HOME;
  const t = pickTranslation(homeDoc, language) || FALLBACK_HOME.i18n.en;

  const servicesDoc = services.data;
  const servicesItems = servicesDoc?.items || [];
  const servicesTr = pickTranslation(servicesDoc, language) || {};
  const servicesT = servicesTr.items || {};

  return (
    <div>
      {/* Hero — عنوان كبير في النص فوق صورة خلفية full-width (public/hero-bg.jpg) */}
      <section className="relative isolate flex min-h-[560px] items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-navy to-[#15406E] text-offwhite xl:min-h-[calc(100svh-6rem)]">
        {/* صورة الخلفية: public/hero-bg.jpg (لو موجودة) وإلا public/hero-bg.svg الافتراضية */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url("${IMAGES.homeHero}"), url(/hero-bg.svg)` }}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-navy/55 via-navy/30 to-navy/60" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />

        <div className="container-content relative py-24 text-center md:py-32">
          <h1 className="mx-auto max-w-5xl font-display text-4xl font-extrabold leading-tight drop-shadow-lg md:text-6xl xl:text-7xl">
            {t.heroTitle}
          </h1>
          <div className="mt-10 flex justify-center">
            <Link href="/services" className="btn-primary group !px-7 !py-3 text-lg uppercase tracking-wide">
              {t.exploreServices}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>

        {/* أيقونة السكرول */}
        <a href="#services-preview" aria-label="Scroll down" className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
          <span className="h-6 w-px bg-white/60" />
          <span className="flex h-11 w-6 justify-center rounded-full border-2 border-white/80 pt-2">
            <span className="hero-scroll-dot h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </a>

        {/* الشريط الملون أسفل الهيرو */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-gold via-gold to-sky" />
      </section>

      {/* Services preview */}
      <section id="services-preview" className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-offwhite to-white py-20 md:py-24">
        <div aria-hidden className="pointer-events-none absolute -top-24 end-0 h-72 w-72 rounded-full bg-sky/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 start-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

        <div className="container-content relative">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              {servicesTr.pageBadge && (
                <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-navy">
                  {servicesTr.pageBadge}
                </span>
              )}
              <h2 className="mt-3 font-display text-3xl font-bold text-navy md:text-4xl">
                {t.whatWeDoTitle}
              </h2>
              <span className="mt-4 block h-1 w-14 rounded-full bg-gold" />
            </div>
            <Link
              href="/services"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-sky transition-colors hover:text-navy"
            >
              {t.viewAllServices?.replace(/\s*[→←]\s*$/, "")}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              />
            </Link>
          </div>

          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {servicesItems.map((service, i) => {
              const st = servicesT[service.slug] || {};
              return (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  style={{ animationDelay: `${i * 90}ms` }}
                  className="svc-rise group relative flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-sky/40 hover:shadow-2xl hover:shadow-navy/15"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-navy">
                    <ServiceVisual
                      slug={service.slug}
                      image={service.image}
                      alt={st.title}
                      className="h-full w-full transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
                    <span className="absolute start-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="relative flex flex-1 flex-col p-6 pt-9">
                    <div className="absolute -top-6 end-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-navy shadow-lg ring-4 ring-white transition-colors duration-300 group-hover:bg-gold">
                      <ServiceIcon name={service.icon} size={22} />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-navy">{st.title}</h3>
                    <p className="mt-2 line-clamp-4 flex-1 text-sm leading-relaxed text-charcoal/70">
                      {st.short}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky transition-colors group-hover:text-navy">
                      {t.learnMore?.replace(/\s*[→←]\s*$/, "")}
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-content py-16 md:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-[#15406E] px-8 py-14 text-offwhite shadow-2xl shadow-navy/20 md:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />
          <div aria-hidden className="pointer-events-none absolute -top-20 end-[-3rem] h-64 w-64 rounded-full bg-sky/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute bottom-[-5rem] start-[-2rem] h-56 w-56 rounded-full bg-gold/20 blur-3xl" />

          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">{t.ctaTitle}</h2>
              <p className="mt-3 leading-relaxed text-offwhite/75">{t.ctaSubtitle}</p>
            </div>
            <Link href="/services" className="btn-primary group shrink-0">
              {t.ctaButton}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
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