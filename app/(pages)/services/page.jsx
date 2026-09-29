// app/services/page.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Play,
  Eye,
  ClipboardCheck,
  HeartHandshake,
  Users,
  ShieldCheck,
  FileText,
  MapPin,
  Star,
  MessageSquare,
  BarChart3,
  Search,
  ListChecks,
  Building2,
  LineChart,
  Target,
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../../lib/useCollectionData";
import ServiceIcon from "../../components/ServiceIcon";
import ServiceVisual from "../../components/ServiceVisual";

// ─────────────────────────────────────────────────────────────────────────
// المحتوى الأساسي للخدمات (العناوين/الوصف القصير) بييجي من كولكشن "services"
// في مونجو. باقي نصوص الصفحة (الهيرو، الـ Suites، الخدمات الفرعية، قسم
// المنصة...) محلية هنا في PAGE عشان مش موجودة في الداتابيز.
// ─────────────────────────────────────────────────────────────────────────
const FALLBACK_SERVICES = {
  items: [
    { slug: "mystery-shopping", icon: "eye" },
    { slug: "managed-services", icon: "users" },
    { slug: "auditing-visits", icon: "clipboard-check" },
    { slug: "customer-experience", icon: "heart-handshake" },
  ],
  i18n: {
    en: {
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

// خريطة أيقونات الخدمات الفرعية
const SUB_ICONS = {
  eye: Eye,
  shield: ShieldCheck,
  file: FileText,
  pin: MapPin,
  star: Star,
  message: MessageSquare,
  chart: BarChart3,
  search: Search,
  list: ListChecks,
  building: Building2,
  line: LineChart,
  target: Target,
  users: Users,
  check: ClipboardCheck,
  heart: HeartHandshake,
};

// ترتيب الكروت الثلاثة (Suites) + الخدمة المُدارة كبلوك مستقل
const SUITES = [
  { slug: "mystery-shopping", tone: "gold", Icon: Eye },
  { slug: "auditing-visits", tone: "navy", Icon: ClipboardCheck },
  { slug: "customer-experience", tone: "sky", Icon: HeartHandshake },
];

// ألوان كل عمود (بنفس فكرة البرتقالي/البني/التركواز في الأصل → ذهبي/كحلي/سماوي)
const TONES = {
  gold: {
    card: "bg-gold/10",
    iconBg: "bg-gold text-white",
    title: "text-[#9A7B14]",
    tagline: "text-[#9A7B14]",
    btn: "bg-gold text-navy hover:bg-[#b3901f]",
    subIcon: "text-gold",
  },
  navy: {
    card: "bg-navy/[0.06]",
    iconBg: "bg-navy text-white",
    title: "text-navy",
    tagline: "text-navy",
    btn: "bg-navy text-offwhite hover:bg-[#15406E]",
    subIcon: "text-navy",
  },
  sky: {
    card: "bg-sky/10",
    iconBg: "bg-sky text-white",
    title: "text-[#137A9E]",
    tagline: "text-[#137A9E]",
    btn: "bg-sky text-white hover:bg-[#1787AD]",
    subIcon: "text-sky",
  },
};

const PAGE = {
  en: {
    heroTitle: "Our Services",
    heroCta: "Get a quote",
    introTitle: "Qualx delivers a full range of quality services to help businesses reach their true potential.",
    introText:
      "Through a comprehensive approach, we help our clients evaluate the customer experience, keep quality standards consistent across every branch, and turn documented findings into real improvements, building customer loyalty while growing sales and profits.",
    videoTitle: "Contact us today!",
    videoText: "We can help you choose the perfect combination of services to maximize your ROI.",
    playLabel: "Play video",
    suiteSuffix: "Suite",
    viewSuite: "View service",
    suites: {
      "mystery-shopping": {
        name: "Mystery Shopping",
        tagline: "Want to know what customers really see? We'll visit and tell you.",
        subs: [
          { icon: "eye", label: "Confidential Visits" },
          { icon: "message", label: "Staff Interaction" },
          { icon: "file", label: "Documented Reports" },
        ],
      },
      "auditing-visits": {
        name: "Operational Audit",
        tagline: "If it has to be done right, we've got your back!",
        subs: [
          { icon: "search", label: "Surprise Inspections" },
          { icon: "list", label: "Standards Checklists" },
          { icon: "building", label: "Facility & Products" },
        ],
      },
      "customer-experience": {
        name: "Customer Experience",
        tagline: "Satisfaction, journeys, benchmarking... it's all there!",
        subs: [
          { icon: "pin", label: "Journey Mapping" },
          { icon: "star", label: "Satisfaction Surveys" },
          { icon: "target", label: "Improvement Plans" },
        ],
      },
    },
    managedTitle: "Managed Services",
    managedTagline: "Need a whole quality department? We've got it!",
    managedSubs: [
      { icon: "check", label: "Quality Assurance" },
      { icon: "eye", label: "Mystery Shopping" },
      { icon: "search", label: "Auditing" },
      { icon: "line", label: "Reporting & Tracking" },
    ],
    platformTitle: "Qualx Reporting",
    platformSub: "PLATFORM",
    platformText:
      "Every service feeds into one clear, documented reporting flow, so you always see where each branch stands and what to fix first.",
    demoTitle: "Let us show you how we generate real value for our clients.",
    demoText:
      "We can help you choose the perfect combination of services to maximize your ability to raise quality and customer satisfaction across all your branches.",
    demoStrong: "Spend smart, improve more. Win-win!",
    demoCta: "Get a quote",
    dashTitle: "Branch score",
    dashSub: "Last 6 visits",
  },
  ar: {
    heroTitle: "خدماتنا",
    heroCta: "اطلب عرض سعر",
    introTitle: "كواليكس بتقدم مجموعة كاملة من خدمات الجودة عشان تساعد شركتك توصل لأقصى إمكانياتها.",
    introText:
      "من خلال نهج متكامل، بنساعد عملاءنا يقيّموا تجربة العميل، ويحافظوا على معايير الجودة موحّدة في كل الفروع، ويحوّلوا النتائج الموثقة لتحسينات حقيقية، وبكده يبنوا ولاء العملاء وتزيد المبيعات والأرباح.",
    videoTitle: "تواصل معانا النهارده!",
    videoText: "نقدر نساعدك تختار التوليفة المثالية من الخدمات عشان تحقق أعلى عائد.",
    playLabel: "شغّل الفيديو",
    suiteSuffix: "",
    viewSuite: "اعرف تفاصيل الخدمة",
    suites: {
      "mystery-shopping": {
        name: "التسوق السري",
        tagline: "عايز تعرف العميل بيشوف إيه فعلًا؟ إحنا نزور ونقولك.",
        subs: [
          { icon: "eye", label: "زيارات سرية" },
          { icon: "message", label: "تعامل الموظفين" },
          { icon: "file", label: "تقارير موثقة" },
        ],
      },
      "auditing-visits": {
        name: "التدقيق التشغيلي",
        tagline: "لو لازم يتعمل صح، إحنا وراك!",
        subs: [
          { icon: "search", label: "تفتيش مفاجئ" },
          { icon: "list", label: "قوائم معايير الجودة" },
          { icon: "building", label: "المنشأة والمنتجات" },
        ],
      },
      "customer-experience": {
        name: "تجربة العملاء",
        tagline: "رضا العملاء، رحلة العميل، المقارنات... كله موجود!",
        subs: [
          { icon: "pin", label: "خريطة رحلة العميل" },
          { icon: "star", label: "استطلاعات الرضا" },
          { icon: "target", label: "خطط التحسين" },
        ],
      },
    },
    managedTitle: "الخدمات المُدارة",
    managedTagline: "محتاج قسم جودة كامل؟ عندنا!",
    managedSubs: [
      { icon: "check", label: "ضبط الجودة" },
      { icon: "eye", label: "التسوق السري" },
      { icon: "search", label: "التدقيق" },
      { icon: "line", label: "التقارير والمتابعة" },
    ],
    platformTitle: "تقارير كواليكس",
    platformSub: "PLATFORM",
    platformText:
      "كل خدماتنا بتصب في مسار تقارير واحد واضح وموثق، عشان تشوف دايمًا وضع كل فرع وإيه أول حاجة تتصلح.",
    demoTitle: "خلّينا نوريك إزاي بنحقق قيمة حقيقية لعملائنا.",
    demoText:
      "نقدر نساعدك تختار التوليفة المثالية من الخدمات عشان ترفع الجودة ورضا العملاء في كل فروعك.",
    demoStrong: "اصرف بذكاء، وحسّن أكتر. مكسب للطرفين!",
    demoCta: "اطلب عرض سعر",
    dashTitle: "تقييم الفرع",
    dashSub: "آخر ٦ زيارات",
  },
};

export default function ServicesPage() {
  const { language } = useLanguage();
  const { data, loading } = useCollectionData("services");
  // نفس صورة هيرو الصفحة الرئيسية بالظبط (heroImage من كولكشن "home")
  const home = useCollectionData("home");
  const [playing, setPlaying] = useState(false);

  if (loading || home.loading) return <PageLoading />;

  const doc = data || FALLBACK_SERVICES;
  const items = doc.items || [];
  const dbT = pickTranslation(doc, language) || FALLBACK_SERVICES.i18n.en;
  const fbT = FALLBACK_SERVICES.i18n[language] || FALLBACK_SERVICES.i18n.en;
  const p = PAGE[language] || PAGE.en;

  const iconOf = (slug) => items.find((s) => s.slug === slug)?.icon;
  const titleOf = (slug) => dbT.items?.[slug]?.title || fbT.items?.[slug]?.title || "";
  const shortOf = (slug) => dbT.items?.[slug]?.short || fbT.items?.[slug]?.short || "";
  const heroImage = home.data?.heroImage || "/hero-bg.jpg";
  const heroVideo = doc.heroVideo; // اختياري: مسار فيديو محلي من public/ (زي "/intro.mp4")

  return (
    <div>
      {/* ═════════ 1) Hero — نفس هيرو الصفحة الرئيسية / الأصل ═════════ */}
      <section className="relative isolate flex min-h-[420px] items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-navy to-[#15406E] text-offwhite md:min-h-[520px]">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage}), url(/hero-bg.svg)` }}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-navy/60 via-navy/35 to-navy/65" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />

        <div className="container-content relative py-20 text-center md:py-28">
          <h1 className="mx-auto max-w-5xl font-display text-5xl font-extrabold leading-tight drop-shadow-lg md:text-7xl">
            {p.heroTitle}
          </h1>
          <div className="mt-8 flex justify-center">
            <a href="#demo" className="btn-primary group !px-7 !py-3 text-base uppercase tracking-wide">
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

      {/* ═════════ 2) شريط التعريف + كارت الفيديو ═════════ */}
      <section id="intro" className="relative scroll-mt-24 overflow-hidden bg-navy py-16 text-offwhite md:py-20">
        <div aria-hidden className="pointer-events-none absolute -top-20 start-[-5rem] h-72 w-72 rounded-full bg-sky/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-4rem] end-[-3rem] h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

        <div className="container-content relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-bold leading-snug md:text-4xl">{p.introTitle}</h2>
            <span className="mt-5 block h-1 w-14 rounded-full bg-gold" />
            <p className="mt-5 text-base leading-loose text-offwhite/80 md:text-lg">{p.introText}</p>
          </div>

          <div className="relative">
            <div aria-hidden className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-gold/30 to-sky/30 blur-xl" />
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-navy/40">
              {playing && heroVideo ? (
                <video src={heroVideo} controls autoPlay className="h-full w-full bg-black object-cover" />
              ) : (
                <>
                  <ServiceVisual slug="customer-experience" alt={p.videoTitle} className="absolute inset-0 h-full w-full" />
                  <div aria-hidden className="absolute inset-0 bg-navy/45" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
                  {heroVideo ? (
                    <button
                      type="button"
                      onClick={() => setPlaying(true)}
                      aria-label={p.playLabel}
                      className="absolute start-1/2 top-[38%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-xl transition-transform hover:scale-110 rtl:translate-x-1/2"
                    >
                      <Play size={26} className="translate-x-0.5 fill-navy" />
                    </button>
                  ) : (
                    <a
                      href="#demo"
                      aria-label={p.heroCta}
                      className="absolute start-1/2 top-[38%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-xl transition-transform hover:scale-110 rtl:translate-x-1/2"
                    >
                      <Play size={26} className="translate-x-0.5 fill-navy" />
                    </a>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="font-display text-xl font-bold text-white md:text-2xl">{p.videoTitle}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/85">{p.videoText}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════ 3) الـ Suites: ٣ أعمدة (كارت رئيسي + كارت خدمات فرعية) ═════════ */}
      <section className="container-content py-16 md:py-20">
        <div className="grid gap-6 lg:grid-cols-3">
          {SUITES.map(({ slug, tone, Icon }, i) => {
            const c = TONES[tone];
            const s = p.suites[slug];
            return (
              <div key={slug} style={{ animationDelay: `${i * 90}ms` }} className="svc-rise flex">
                <div className={`flex w-full flex-col items-center rounded-sm px-7 py-8 text-center ${c.card}`}>
                  <span className={`flex h-16 w-16 items-center justify-center rounded-full ${c.iconBg} shadow-lg`}>
                    <Icon size={30} />
                  </span>
                  <h3 className={`mt-4 font-display text-xl font-bold leading-tight ${c.title}`}>
                    {s.name}
                    {p.suiteSuffix && (
                      <>
                        <br />
                        {p.suiteSuffix}
                      </>
                    )}
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-charcoal/70">{shortOf(slug)}</p>

                  {/* الخدمات الفرعية جوه الكارت */}
                  <ul className="mt-6 w-full space-y-3 border-y border-charcoal/10 py-5 ps-[18%] text-start">
                    {s.subs.map((sub) => {
                      const SubIcon = SUB_ICONS[sub.icon] || Check;
                      return (
                        <li key={sub.label} className="flex items-center gap-3 text-sm text-charcoal/75">
                          <SubIcon size={22} strokeWidth={1.7} className={`shrink-0 ${c.subIcon}`} />
                          <span>{sub.label}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <p className={`mt-5 flex min-h-[2.75rem] items-center text-sm font-bold leading-snug ${c.tagline}`}>{s.tagline}</p>
                  <Link
                    href={`/services/${slug}`}
                    className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${c.btn}`}
                  >
                    {p.viewSuite}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═════════ 4) خطوط التدفق + بلوك الخدمات المُدارة ═════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-charcoal/[0.06] to-offwhite py-16 md:py-20">
        <div className="container-content">
          <FlowTop />

          <div className="mt-6 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16">
            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy text-gold shadow-lg">
                <ServiceIcon name={iconOf("managed-services") || "users"} size={30} />
              </span>
              <h3 className="mt-4 font-display text-2xl font-bold text-navy">{titleOf("managed-services") || p.managedTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{shortOf("managed-services")}</p>
              <p className="mt-4 text-sm font-bold text-[#9A7B14]">{p.managedTagline}</p>
              <Link
                href="/services/managed-services"
                className="mt-5 inline-flex items-center gap-2 rounded-sm bg-navy px-5 py-3 text-sm font-semibold uppercase tracking-wide text-offwhite transition-colors hover:bg-[#15406E]"
              >
                {p.viewSuite}
                <ArrowRight size={16} className="rtl:rotate-180" />
              </Link>
            </div>

            <ul className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {p.managedSubs.map((sub, i) => {
                const SubIcon = SUB_ICONS[sub.icon] || Check;
                const color = ["text-gold", "text-sky", "text-navy", "text-[#9A7B14]"][i % 4];
                return (
                  <li key={sub.label} className="flex flex-col items-center gap-3 text-center">
                    <SubIcon size={40} strokeWidth={1.6} className={color} />
                    <span className="text-sm leading-snug text-charcoal/70">{sub.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <FlowBottom />

          {/* ═════════ 5) المنصة ═════════ */}
          <div className="mt-14 text-center md:mt-2">
            <div className="inline-flex items-center gap-3">
              <span className="flex items-end gap-1" aria-hidden>
                <span className="h-5 w-2.5 rounded-sm bg-sky" />
                <span className="h-8 w-2.5 rounded-sm bg-gold" />
                <span className="h-11 w-2.5 rounded-sm bg-navy" />
              </span>
              <span className="text-start">
                <span className="block font-display text-4xl font-bold leading-none text-navy md:text-5xl">{p.platformTitle}</span>
                <span className="mt-1 block text-xs font-semibold tracking-[0.5em] text-charcoal/60">{p.platformSub}</span>
              </span>
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-base leading-relaxed text-charcoal/65">{p.platformText}</p>
          </div>
        </div>
      </section>

      {/* ═════════ 6) Demo: لوحة نتائج + دعوة للتواصل ═════════ */}
      <section id="demo" className="scroll-mt-24 bg-offwhite pb-20 pt-6 md:pb-24">
        <div className="container-content grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <DashboardMock title={p.dashTitle} sub={p.dashSub} />

          <div>
            <h2 className="font-display text-3xl font-bold leading-snug text-[#137A9E] md:text-4xl">{p.demoTitle}</h2>
            <p className="mt-4 leading-relaxed text-charcoal/70">{p.demoText}</p>
            <p className="mt-4 font-semibold text-navy">{p.demoStrong}</p>
            <Link href="/login" className="btn-primary group mt-7">
              {p.demoCta}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ───────────── خطوط التدفق المنحنية بين الأقسام (SVG بدون تمطيط، وبتتعكس في RTL) ─────────────
   x=207 من 1100 ≈ مركز عمود "الخدمات المُدارة"، و x=550 = مركز شعار المنصة. */
function FlowTop() {
  return (
    <svg viewBox="0 0 1100 120" className="mb-2 hidden h-auto w-full md:block rtl:-scale-x-100" fill="none" aria-hidden>
      <path
        d="M10 4 C10 28 30 40 70 40 L1000 40 C1080 40 1080 84 1000 84 L257 84 C227 84 207 96 207 108 L207 114"
        stroke="#C9A227"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M198 104 L207 116 L216 104" stroke="#C9A227" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {[300, 560, 830].map((x) => (
        <path key={x} d={`M${x - 5} 33 L${x + 6} 40 L${x - 5} 47`} stroke="#C9A227" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function FlowBottom() {
  return (
    <svg viewBox="0 0 1100 130" className="my-4 hidden h-auto w-full md:block rtl:-scale-x-100" fill="none" aria-hidden>
      <path
        d="M207 0 L207 20 C207 46 227 58 257 58 L1000 58 C1090 58 1090 98 1000 98 L590 98 C560 98 550 106 550 118 L550 124"
        stroke="#C9A227"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M541 114 L550 126 L559 114" stroke="#C9A227" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {[420, 760].map((x) => (
        <path key={x} d={`M${x - 5} 51 L${x + 6} 58 L${x - 5} 65`} stroke="#C9A227" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

/* ───────────── لوحة نتائج توضيحية (بدل صورة الداشبورد) ───────────── */
function DashboardMock({ title, sub }) {
  const bars = [46, 62, 55, 74, 68, 86];
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div aria-hidden className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-gold/25 to-sky/25 blur-xl" />
      <div className="relative rounded-[1.6rem] border-[6px] border-navy bg-navy p-2 shadow-2xl shadow-navy/30">
        <div className="rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm font-bold text-navy">{title}</p>
              <p className="text-[10px] text-charcoal/50">{sub}</p>
            </div>
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-[#9A7B14]">86.7%</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["92%", "text-sky"],
              ["88%", "text-[#9A7B14]"],
              ["79%", "text-navy"],
            ].map(([v, cls], i) => (
              <div key={i} className="rounded-lg bg-offwhite p-2 text-center">
                <p className={`font-display text-lg font-bold ${cls}`}>{v}</p>
                <div className="mx-auto mt-1 h-1 w-8 rounded-full bg-charcoal/10" />
              </div>
            ))}
          </div>

          <div className="mt-4 flex h-28 items-end gap-2 rounded-lg bg-offwhite p-3">
            {bars.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-t-sm ${i === bars.length - 1 ? "bg-gold" : "bg-sky/70"}`}
              />
            ))}
          </div>

          <div className="mt-3 space-y-1.5">
            {[70, 54, 82].map((w, i) => (
              <div key={i} className="h-2 rounded-full bg-charcoal/[0.07]">
                <div style={{ width: `${w}%` }} className="h-2 rounded-full bg-navy/70" />
              </div>
            ))}
          </div>
        </div>
      </div>
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