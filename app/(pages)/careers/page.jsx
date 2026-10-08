// app/careers/page.jsx
"use client";

import {
  ArrowRight,
  Briefcase,
  Clock,
  MapPin,
  Mail,
  Megaphone,
  Eye,
  ClipboardCheck,
  Lightbulb,
  BadgeCheck,
  LineChart,
  TrendingUp,
  HeartHandshake,
  FileText,
  Search,
  MessageSquare,
  UserCheck,
  Send,
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useCollectionData, pickTranslation, mergePageText } from "../../lib/useCollectionData";
import { IMAGES } from "../../lib/siteImages";

// 🎨 صفحة الوظائف بنفس لغة تصميم صفحة الخدمات: هيرو بصورة الرئيسية، شريط
// Navy تعريفي، كروت ملوّنة (ذهبي / كحلي / سماوي)، خط تدفق ذهبي، وبانر تواصل.
// الوظائف نفسها (العنوان، النوع، المكان، الوصف) لسه جايه من كولكشن "careers".
// نصوص الأقسام الإضافية (المميزات، خطوات التوظيف، الأزرار) محلية في PAGE تحت.

// أيقونة لكل وظيفة حسب الـ slug (وأي slug جديد بياخد Briefcase)
const ROLE_ICONS = {
  marketing: Megaphone,
  "mystery-shopper": Eye,
  auditor: ClipboardCheck,
  "quality-auditor": ClipboardCheck,
  advisor: Lightbulb,
  "quality-validation": BadgeCheck,
  "cx-analyst": LineChart,
};

// نفس ألوان كروت الخدمات
const TONES = {
  gold: {
    card: "bg-gold/10",
    iconBg: "bg-gold text-white",
    title: "text-[#9A7B14]",
    btn: "bg-gold text-navy hover:bg-[#b3901f]",
    metaIcon: "text-gold",
  },
  navy: {
    card: "bg-navy/[0.06]",
    iconBg: "bg-navy text-white",
    title: "text-navy",
    btn: "bg-navy text-offwhite hover:bg-[#15406E]",
    metaIcon: "text-navy",
  },
  sky: {
    card: "bg-sky/10",
    iconBg: "bg-sky text-white",
    title: "text-[#137A9E]",
    btn: "bg-sky text-white hover:bg-[#1787AD]",
    metaIcon: "text-sky",
  },
};
const TONE_ORDER = ["gold", "navy", "sky"];

const PAGE = {
  en: {
    heroCta: "View open roles",
    perks: [
      { icon: MapPin, text: "Work on real projects across Egypt" },
      { icon: TrendingUp, text: "Grow your skills inside a hands-on quality team" },
      { icon: HeartHandshake, text: "A small, friendly team that values the details you notice" },
    ],
    hiringTitle: "How we hire",
    hiringSteps: [
      { icon: FileText, title: "Apply", text: "Send your CV and tell us where you'd add value." },
      { icon: Search, title: "Review", text: "We review your profile against the role." },
      { icon: MessageSquare, title: "Conversation", text: "A short chat so we get to know you." },
      { icon: UserCheck, title: "Join", text: "Start with onboarding and your first assignment." },
    ],
    ctaButton: "Send your CV",
    empty: "No open roles right now, but we'd still love to hear from you.",
  },
  ar: {
    heroCta: "شوف الوظائف المتاحة",
    perks: [
      { icon: MapPin, text: "اشتغل على مشاريع حقيقية في كل مصر" },
      { icon: TrendingUp, text: "طوّر مهاراتك جوه فريق جودة شغال ميداني" },
      { icon: HeartHandshake, text: "فريق صغير وودود بيقدّر التفاصيل اللي بتلاحظها" },
    ],
    hiringTitle: "بنوظّف إزاي",
    hiringSteps: [
      { icon: FileText, title: "قدّم", text: "ابعت سيرتك الذاتية وقولنا فين ممكن تضيف قيمة." },
      { icon: Search, title: "مراجعة", text: "بنراجع ملفك على متطلبات الوظيفة." },
      { icon: MessageSquare, title: "محادثة", text: "لقاء قصير عشان نتعرف عليك." },
      { icon: UserCheck, title: "انضم", text: "بتبدأ بالتعريف بالشغل وأول مهمة ليك." },
    ],
    ctaButton: "ابعت سيرتك الذاتية",
    empty: "مفيش وظايف متاحة دلوقتي، بس لسه حابين نسمع منك.",
  },
};

const FALLBACK_CAREERS = {
  contactEmail: "hello@merlix.com",
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
            "Plan and run marketing campaigns across digital and offline channels, grow Merlix's brand presence, and generate qualified leads for our services.",
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
            "تخطيط وتنفيذ حملات تسويقية على القنوات الرقمية والتقليدية، تنمية حضور براند Merlix وجلب عملاء محتملين لخدماتنا.",
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
  const p = mergePageText(PAGE[language] || PAGE.en, t.page);
  const contactEmail = doc.contactEmail || FALLBACK_CAREERS.contactEmail;
  const heroImage = IMAGES.careersHero;

  return (
    <div>
      {/* ═════════ 1) Hero — نفس هيرو الخدمات والرئيسية ═════════ */}
      <section className="relative isolate flex min-h-[420px] items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-navy to-[#15406E] text-offwhite md:min-h-[520px]">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url("${heroImage}"), url(/hero-bg.svg)` }}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-navy/60 via-navy/35 to-navy/65" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />

        <div className="container-content relative py-20 text-center md:py-28">
          <h1 className="mx-auto max-w-5xl font-display text-5xl font-extrabold leading-tight drop-shadow-lg md:text-7xl">
            {t.badge}
          </h1>
          <div className="mt-8 flex justify-center">
            <a href="#roles" className="btn-primary group !px-7 !py-3 text-base uppercase tracking-wide">
              {p.heroCta}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </a>
          </div>
        </div>

        <a href="#intro" aria-label="Scroll down" className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
          <span className="h-5 w-px bg-white/60" />
          <span className="flex h-11 w-6 justify-center rounded-full border-2 border-white/80 pt-2">
            <span className="hero-scroll-dot h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </a>

        <div aria-hidden className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-gold via-gold to-sky" />
      </section>

      {/* ═════════ 2) الشريط التعريفي + كروت المميزات ═════════ */}
      <section id="intro" className="relative scroll-mt-24 overflow-hidden bg-navy py-16 text-offwhite md:py-20">
        <div aria-hidden className="pointer-events-none absolute -top-20 start-[-5rem] h-72 w-72 rounded-full bg-sky/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-4rem] end-[-3rem] h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

        <div className="container-content relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-bold leading-snug md:text-4xl">{t.heroTitle}</h2>
            <span className="mt-5 block h-1 w-14 rounded-full bg-gold" />
            <p className="mt-5 text-base leading-loose text-offwhite/80 md:text-lg">{t.heroText}</p>
          </div>

          <ul className="space-y-4">
            {p.perks.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-sky/50 hover:bg-white/10"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-navy">
                  <Icon size={22} />
                </span>
                <span className="text-sm font-medium leading-relaxed text-offwhite">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═════════ 3) الوظائف المتاحة: كروت ملوّنة زي كروت الخدمات ═════════ */}
      <section id="roles" className="container-content scroll-mt-24 py-16 md:py-20">
        <div className="flex items-center justify-center gap-3">
          <h2 className="font-display text-3xl font-bold text-navy md:text-4xl">{t.openRolesTitle}</h2>
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">{items.length}</span>
        </div>
        <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-gold" />

        {items.length === 0 ? (
          <p className="mt-10 text-center text-charcoal/70">{p.empty}</p>
        ) : (
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            {items.map((role, i) => {
              const rt = t.items?.[role.slug] || {};
              const c = TONES[TONE_ORDER[i % TONE_ORDER.length]];
              const Icon = ROLE_ICONS[role.slug] || Briefcase;
              return (
                <article
                  key={role.slug}
                  style={{ animationDelay: `${i * 90}ms` }}
                  className={`svc-rise flex w-full flex-col items-center rounded-sm px-7 py-8 text-center sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] ${c.card}`}
                >
                  <span className={`flex h-16 w-16 items-center justify-center rounded-full ${c.iconBg} shadow-lg`}>
                    <Icon size={30} />
                  </span>
                  <h3 className={`mt-4 font-display text-xl font-bold leading-tight ${c.title}`}>{rt.title}</h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-charcoal/70">{rt.description}</p>

                  <ul className="mt-6 w-full space-y-3 border-y border-charcoal/10 py-5 ps-[12%] text-start">
                    <li className="flex items-center gap-3 text-sm text-charcoal/75">
                      <Clock size={20} strokeWidth={1.7} className={`shrink-0 ${c.metaIcon}`} />
                      <span>{rt.type}</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-charcoal/75">
                      <MapPin size={20} strokeWidth={1.7} className={`shrink-0 ${c.metaIcon}`} />
                      <span>{rt.location}</span>
                    </li>
                  </ul>

                  <a
                    href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                      "Application: " + (rt.title || role.slug)
                    )}`}
                    className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${c.btn}`}
                  >
                    {t.applyNow}
                    <ArrowRight size={16} className="rtl:rotate-180" />
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ═════════ 4) خطوات التوظيف + خط التدفق الذهبي ═════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-charcoal/[0.06] to-offwhite py-16 md:py-20">
        <div className="container-content">
          <h2 className="text-center font-display text-3xl font-bold text-navy md:text-4xl">{p.hiringTitle}</h2>
          <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-gold" />

          <div className="relative mt-14">
            {/* الخط الذهبي اللي بيوصل الخطوات */}
            <div aria-hidden className="absolute inset-x-[12.5%] top-8 hidden h-[6px] rounded-full bg-gold lg:block" />
            <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {p.hiringSteps.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="flex flex-col items-center text-center">
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-navy text-gold shadow-lg ring-8 ring-[#EEF0F2]">
                    <Icon size={28} />
                    <span className="absolute -top-2 end-[-0.4rem] flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy">{title}</h3>
                  <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-charcoal/70">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ═════════ 5) بانر التواصل (مش لاقي وظيفة تناسبك؟) ═════════ */}
      <section className="container-content py-16 md:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-[#15406E] px-8 py-12 text-offwhite shadow-2xl shadow-navy/20 md:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />
          <div aria-hidden className="pointer-events-none absolute -top-20 end-[-3rem] h-64 w-64 rounded-full bg-sky/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute bottom-[-5rem] start-[-2rem] h-56 w-56 rounded-full bg-gold/20 blur-3xl" />

          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="flex items-start gap-5 md:items-center">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold text-navy shadow-lg shadow-gold/20">
                <Mail size={24} />
              </span>
              <p className="max-w-xl text-base leading-relaxed text-offwhite/85">
                {t.noRoleText}{" "}
                <a href={`mailto:${contactEmail}`} className="font-semibold text-gold hover:underline" dir="ltr">
                  {contactEmail}
                </a>{" "}
                {t.noRoleTail}
              </p>
            </div>
            <a href={`mailto:${contactEmail}`} className="btn-primary group shrink-0">
              {p.ctaButton}
              <Send size={16} className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
            </a>
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