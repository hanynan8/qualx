// app/page.jsx
"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Users2, ClipboardList } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "./lib/useCollectionData";
import ServiceIcon from "./components/ServiceIcon";

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
        "Qualx is a company specialized in evaluating customer experience and quality control (Mystery Shopping & QA) for businesses and branches across Egypt, through confidential evaluation visits and documented reports. We also provide fully equipped quality staff for your location and deliver real, actionable solutions to help your business grow.",
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

const CARD_ICON_COMPONENTS = { shield: ShieldCheck, users: Users2, clipboard: ClipboardList };

export default function HomePage() {
  const { language } = useLanguage();
  const home = useCollectionData("home");
  const services = useCollectionData("services");

  if (home.loading || services.loading) return <PageLoading />;

  const homeDoc = home.data || FALLBACK_HOME;
  const t = pickTranslation(homeDoc, language) || FALLBACK_HOME.i18n.en;
  const cardIcons = homeDoc.cardIcons || FALLBACK_HOME.cardIcons;

  const servicesDoc = services.data;
  const servicesItems = servicesDoc?.items || [];
  const servicesT = pickTranslation(servicesDoc, language)?.items || {};

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy text-offwhite">
        <div className="container-content grid items-center gap-12 py-24 md:grid-cols-2 md:py-32">
          <div>
            <span className="inline-block rounded-full border border-gold/40 px-3 py-1 text-xs font-medium text-gold">
              {t.badge}
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight md:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-6 max-w-lg text-offwhite/75">{t.heroSummary}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/services" className="btn-primary">
                {t.exploreServices}
                <ArrowRight size={16} />
              </Link>
              <Link href="/careers" className="btn-secondary">
                {t.joinTeam}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {cardIcons.map((iconKey, i) => {
              const Icon = CARD_ICON_COMPONENTS[iconKey] || ShieldCheck;
              return (
                <div
                  key={iconKey}
                  className={`rounded-lg bg-white/5 p-6 ${i % 2 === 1 ? "mt-6 sm:mt-12" : ""}`}
                >
                  <Icon className="text-sky" size={28} />
                  <p className="mt-4 text-sm text-offwhite/80">{t.cards?.[iconKey]}</p>
                </div>
              );
            })}
            <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 p-6 sm:mt-12">
              <p className="font-display text-2xl font-semibold text-gold">{t.uspLabel}</p>
              <p className="mt-2 text-sm text-offwhite/80">{t.uspText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="border-b border-charcoal/10 bg-white">
        <div className="container-content grid gap-10 py-20 md:grid-cols-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-navy">{t.whoWeAreTitle}</h2>
          </div>
          <div className="md:col-span-2">
            <p className="text-charcoal/80 leading-relaxed">{t.heroSummary}</p>
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="container-content py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-navy">{t.whatWeDoTitle}</h2>
          <Link href="/services" className="text-sm font-medium text-sky hover:text-navy">
            {t.viewAllServices}
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {servicesItems.map((service) => {
            const st = servicesT[service.slug] || {};
            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group flex flex-col rounded-lg border border-charcoal/10 bg-white p-6 transition-colors hover:border-sky"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded bg-navy text-gold">
                  <ServiceIcon name={service.icon} />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-navy">{st.title}</h3>
                <p className="mt-2 flex-1 text-sm text-charcoal/70">{st.short}</p>
                <span className="mt-4 text-sm font-medium text-sky group-hover:text-navy">
                  {t.learnMore}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sky/10">
        <div className="container-content flex flex-col items-start justify-between gap-6 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold text-navy">{t.ctaTitle}</h2>
            <p className="mt-2 text-charcoal/70">{t.ctaSubtitle}</p>
          </div>
          <Link href="/services" className="btn-primary">
            {t.ctaButton}
            <ArrowRight size={16} />
          </Link>
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