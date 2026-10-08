// app/(pages)/about/page.jsx
"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Users2, ClipboardList } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../../lib/useCollectionData";
import { IMAGES } from "../../lib/siteImages";

// صفحة About us: قسم "Who we are" اللي كان في الرئيسية اتنقل هنا.
// المحتوى (الملخص، الكروت، الميزة) لسه جاي من كولكشن "home" زي ما كان،
// والـ FALLBACK بنفس النصوص الحالية لحد ما الكولكشن يتعمل seed.
const FALLBACK_HOME = {
  cardIcons: ["shield", "users", "clipboard"],
  i18n: {
    en: {
      badge: "Mystery Shopping · Auditing · CX",
      heroSummary:
        "Merlix is a company specialized in evaluating customer experience and quality control (Mystery Shopping & QA) for businesses and branches across Egypt, through confidential evaluation visits and documented reports. We also provide fully equipped quality staff for your location and deliver real, actionable solutions to help your business grow.",
      cards: {
        shield: "Confidential, structured evaluation visits across Egypt",
        users: "A dedicated quality team, embedded in your operation",
        clipboard: "Documented findings turned into real, actionable plans",
      },
      uspLabel: "USP",
      uspText: "Built from a real understanding of the Egyptian market",
      whoWeAreTitle: "Who we are",
    },
    ar: {
      badge: "تسوق سري · تدقيق · تجربة عملاء",
      heroSummary:
        "كواليكس شركة متخصصة في تقييم تجربة العملاء وضبط الجودة (Mystery Shopping & QA) للشركات والفروع في مصر، من خلال زيارات تقييم سرية وتقارير موثقة. كمان بنوفر فريق جودة جاهز لموقعك ونقدم حلول عملية فعلية تساعد شركتك تنمو.",
      cards: {
        shield: "زيارات تقييم سرية ومنظمة في كل مصر",
        users: "فريق جودة مخصص، مندمج في تشغيلك",
        clipboard: "نتائج موثقة تتحول لخطط عملية فعلية",
      },
      uspLabel: "ميزتنا",
      uspText: "مبني على فهم حقيقي للسوق المصري",
      whoWeAreTitle: "مين إحنا",
    },
  },
};

const PAGE = {
  en: {
    pageTitle: "About us",
    explore: "Explore our services",
    contact: "Get in touch",
    ctaTitle: "Ready to see your business through your customers' eyes?",
    ctaSubtitle: "Tell us about your branches — we'll put together a plan.",
  },
  ar: {
    pageTitle: "من نحن",
    explore: "استكشف خدماتنا",
    contact: "تواصل معانا",
    ctaTitle: "جاهز تشوف شركتك بعين عملائك؟",
    ctaSubtitle: "احكيلنا عن فروعك — هنجهزلك خطة.",
  },
};

const CARD_ICON_COMPONENTS = { shield: ShieldCheck, users: Users2, clipboard: ClipboardList };

export default function AboutPage() {
  const { language } = useLanguage();
  const home = useCollectionData("home");

  if (home.loading) return <PageLoading />;

  const homeDoc = home.data || FALLBACK_HOME;
  const fb = FALLBACK_HOME.i18n[language] || FALLBACK_HOME.i18n.en;
  const t = { ...fb, ...(pickTranslation(homeDoc, language) || {}) };
  const p = PAGE[language] || PAGE.en;
  const cardIcons = homeDoc.cardIcons || FALLBACK_HOME.cardIcons;

  return (
    <div>
      {/* Hero — نفس هيرو الرئيسية / الخدمات / الوظائف */}
      <section className="relative isolate flex min-h-[420px] items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-navy to-[#15406E] text-offwhite md:min-h-[520px]">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url("${IMAGES.aboutHero}"), url(/hero-bg.svg)` }}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-navy/60 via-navy/35 to-navy/65" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />

        <div className="container-content relative py-20 text-center md:py-28">
          <h1 className="mx-auto max-w-5xl font-display text-5xl font-extrabold leading-tight drop-shadow-lg md:text-7xl">
            {p.pageTitle}
          </h1>
          <div className="mt-8 flex justify-center">
            <Link href="/solutions" className="btn-primary group !px-7 !py-3 text-base uppercase tracking-wide">
              {p.explore}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>

        <a href="#who-we-are" aria-label="Scroll down" className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
          <span className="h-5 w-px bg-white/60" />
          <span className="flex h-11 w-6 justify-center rounded-full border-2 border-white/80 pt-2">
            <span className="hero-scroll-dot h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </a>

        <div aria-hidden className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-gold via-gold to-sky" />
      </section>

      {/* Who we are */}
      <section id="who-we-are" className="relative scroll-mt-24 overflow-hidden bg-navy py-20 text-offwhite md:py-28">
        <div aria-hidden className="pointer-events-none absolute -top-20 start-[-5rem] h-72 w-72 rounded-full bg-sky/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-4rem] end-[-3rem] h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

        <div className="container-content relative grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="font-display text-3xl font-bold text-offwhite md:text-4xl">
              {t.whoWeAreTitle}
            </h2>
            <span className="mt-4 block h-1 w-14 rounded-full bg-gold" />

            <p className="mt-6 text-base leading-loose text-offwhite/80 md:text-lg">
              {t.heroSummary}
            </p>

            <ul className="mt-8 space-y-4">
              {cardIcons.map((iconKey) => {
                const Icon = CARD_ICON_COMPONENTS[iconKey] || ShieldCheck;
                return (
                  <li
                    key={iconKey}
                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-sky/50 hover:bg-white/10"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-navy">
                      <Icon size={22} />
                    </span>
                    <span className="text-sm font-medium leading-relaxed text-offwhite">
                      {t.cards?.[iconKey]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="relative mb-8 lg:mb-0">
            <div aria-hidden className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-gold/30 to-sky/30 blur-xl" />
            <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-navy/25">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMAGES.aboutWhoWeAre} alt={t.whoWeAreTitle} loading="lazy" className="h-full w-full object-cover" />
            </div>

            <div className="absolute -bottom-6 start-4 max-w-[16rem] rounded-2xl border border-gold/40 bg-white p-4 shadow-xl sm:start-8">
              <p className="font-display text-sm font-bold uppercase tracking-wide text-gold">
                {t.uspLabel}
              </p>
              <p className="mt-1 text-sm font-medium leading-snug text-navy">{t.uspText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-content py-16 md:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-[#15406E] px-8 py-14 text-offwhite shadow-2xl shadow-navy/20 md:px-14">
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">{p.ctaTitle}</h2>
              <p className="mt-3 leading-relaxed text-offwhite/75">{p.ctaSubtitle}</p>
            </div>
            <Link href="/solutions" className="btn-primary group shrink-0">
              {p.contact}
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