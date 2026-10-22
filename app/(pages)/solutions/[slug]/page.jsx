// app/services/[slug]/page.jsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, LayoutDashboard } from "lucide-react";
import { MYSTERY_DASHBOARD_PATH } from "../../../lib/dashboardAccess";
import { useLanguage } from "../../../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../../../lib/useCollectionData";
import ServiceIcon from "../../../components/ServiceIcon";
import ServiceVisual from "../../../components/ServiceVisual";
import DashboardPreview from "../../../components/DashboardPreview";
import AuditDashboardPreview from "../../../components/AuditDashboardPreview";
import PageHero from "../../../components/PageHero";
import { serviceImage } from "../../../lib/siteImages";
import { FALLBACK_SERVICES } from "../../../lib/servicesFallback";
import { useContactForm } from "../../../components/ContactFormProvider";

// 🔄 DYNAMIC: كانت الصفحة دي Server Component بتستخدم generateStaticParams +
// generateMetadata (SSG). بما إن المحتوى بقى ديناميكي 100% من مونجو وبيتقرا
// client-side زي باقي الصفحات، شلنا الاتنين (مش هيشتغلوا أساسًا في client
// component) والصفحة بترندر كل حاجة بعد ما تجيب بيانات كولكشن "services".
export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const { data, loading } = useCollectionData("services");
  const { openForm } = useContactForm();

  if (loading) return <PageLoading />;

  // لو الداتابيز مفيهاش الخدمة (أو وصفها/مميزاتها) بنرجع للمحتوى الافتراضي.
  const doc = data || FALLBACK_SERVICES;
  const fbT = FALLBACK_SERVICES.i18n[language] || FALLBACK_SERVICES.i18n.en;
  const dbT = pickTranslation(doc, language) || {};
  const mergedItems = {};
  for (const k of new Set([...Object.keys(fbT.items || {}), ...Object.keys(dbT.items || {})])) {
    mergedItems[k] = { ...(fbT.items?.[k] || {}), ...(dbT.items?.[k] || {}) };
  }
  const t = { ...fbT, ...dbT, items: mergedItems };

  const dbItems = doc.items || [];
  const items = [
    ...dbItems,
    ...FALLBACK_SERVICES.items.filter((f) => !dbItems.some((d) => d.slug === f.slug)),
  ];
  const service = items.find((s) => s.slug === slug);
  const st = service ? mergedItems[slug] : null;

  if (!service || !st || !st.title) return <NotFoundState language={language} />;

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
              <ServiceVisual slug={service.slug} image={serviceImage(service)} alt={st.title} className="h-full w-full" />
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

          <button type="button" onClick={() => openForm({ kind: "service", subject: st.title })} className="btn-primary group mt-8">
            {t.askAboutService || "Ask about this service"}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </button>
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

      {/* 📊 قسم الداشبورد — خاص بخدمة الميستري شوبنج. الراوت نفسه محمي (تسجيل دخول مطلوب). */}
      {slug === "mystery-shopping" && <MysteryDashboardSection language={language} />}

      {/* 📊 قسم الداشبورد — خاص بخدمة الـ Operational Audit (auditing-visits). الداشبورد لسه قريبًا. */}
      {slug === "auditing-visits" && <AuditDashboardSection language={language} />}

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
                  href={`/solutions/${s2.slug}`}
                  style={{ animationDelay: `${i * 90}ms` }}
                  className="svc-rise group overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-sky/40 hover:shadow-2xl hover:shadow-navy/15"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-navy">
                    <ServiceVisual
                      slug={s2.slug}
                      image={serviceImage(s2)}
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

function MysteryDashboardSection({ language }) {
  const isAr = language === "ar";
  const c = isAr
    ? {
        badge: "مُضمَّن مع الخدمة",
        title: "هتتابع كل النتائج من داشبورد خاص بيك",
        text: "مش هتستنى تقارير على الإيميل. مع كل زيارة ميستري شوبنج بتحصل على داشبورد مباشر بتشوف فيه نتائج فروعك لحظة بلحظة، وتقارن الأداء وتحدد نقاط التحسين بسهولة.",
        points: [
          "درجة الجودة الكلية ومؤشرات الأداء الرئيسية في شاشة واحدة",
          "مقارنة أداء الفروع وترتيبها",
          "اتجاه الأداء شهريًا ومعايير التقييم (الخدمة، النظافة، السرعة، سلوك الموظفين)",
          "تحميل التقارير الكاملة في أي وقت",
        ],
        cta: "افتح الداشبورد",
        note: "يتطلب تسجيل الدخول",
        caption: "صورة توضيحية — الأرقام للعرض فقط",
      }
    : {
        badge: "Included with the service",
        title: "Track every result in your own dashboard",
        text: "No more waiting for reports by email. With every mystery shopping visit you get a live dashboard to follow your branch results as they come in, compare performance, and spot exactly where to improve.",
        points: [
          "Overall quality score and key KPIs on a single screen",
          "Branch-by-branch comparison and ranking",
          "Monthly trends and criteria scores (service, cleanliness, speed, staff behavior)",
          "Download full reports anytime",
        ],
        cta: "Open dashboard",
        note: "Sign-in required",
        caption: "Illustrative preview — figures are sample data",
      };

  return (
    <section className="border-t border-charcoal/10 bg-gradient-to-br from-navy to-[#15406E] text-offwhite">
      <div className="container-content grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
            <LayoutDashboard size={14} />
            {c.badge}
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight md:text-4xl">{c.title}</h2>
          <span className="mt-4 block h-1 w-14 rounded-full bg-gold" />
          <p className="mt-6 text-base leading-loose text-offwhite/80">{c.text}</p>

          <ul className="mt-6 space-y-3">
            {c.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-offwhite/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-navy">
                  <Check size={12} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={MYSTERY_DASHBOARD_PATH} className="btn-primary group">
              {c.cta}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
            <span className="text-xs text-offwhite/60">{c.note}</span>
          </div>
        </div>

        <div className="relative">
          <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-gold/25 to-sky/25 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/40">
            <DashboardPreview language={language} />
          </div>
          <p className="relative mt-3 text-center text-xs text-offwhite/50">{c.caption}</p>
        </div>
      </div>
    </section>
  );
}

function AuditDashboardSection({ language }) {
  const isAr = language === "ar";
  const c = isAr
    ? {
        badge: "مُضمَّن مع الخدمة",
        soon: "قريبًا",
        title: "هتتابع كل نتائج التدقيق من داشبورد خاص بيك",
        text: "مش هتستنى تقارير على الإيميل. مع كل زيارة تدقيق هيكون عندك داشبورد مباشر بتشوف فيه نتائج فروعك لحظة بلحظة، وتتابع نسب الالتزام وتتأكد إن كل ملاحظة اتقفلت.",
        points: [
          "نسبة الالتزام الكلية ومؤشرات الأداء الرئيسية في شاشة واحدة",
          "مقارنة التزام الفروع وترتيبها",
          "اتجاه الالتزام شهريًا ومجالات التدقيق (المنتجات، المنشأة، النظافة والسلامة، الإجراءات)",
          "متابعة الملاحظات المفتوحة وتحميل التقارير الكاملة في أي وقت",
        ],
        note: "الداشبورد هيكون متاح قريبًا ويتطلب تسجيل الدخول",
        caption: "صورة توضيحية — الأرقام للعرض فقط",
      }
    : {
        badge: "Included with the service",
        soon: "Coming soon",
        title: "Track every audit result in your own dashboard",
        text: "No more waiting for reports by email. With every audit visit you'll get a live dashboard to follow your branch results as they come in, track compliance rates, and make sure every finding gets closed.",
        points: [
          "Overall compliance rate and key KPIs on a single screen",
          "Branch-by-branch compliance comparison and ranking",
          "Monthly trends and audit areas (products, facility, hygiene & safety, procedures)",
          "Follow open findings and download full reports anytime",
        ],
        note: "Dashboard launching soon — sign-in will be required",
        caption: "Illustrative preview — figures are sample data",
      };

  return (
    <section className="border-t border-charcoal/10 bg-gradient-to-br from-navy to-[#15406E] text-offwhite">
      <div className="container-content grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              <LayoutDashboard size={14} />
              {c.badge}
            </span>
            <span className="inline-flex items-center rounded-full bg-sky/20 px-3 py-1 text-xs font-semibold text-sky">
              {c.soon}
            </span>
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight md:text-4xl">{c.title}</h2>
          <span className="mt-4 block h-1 w-14 rounded-full bg-gold" />
          <p className="mt-6 text-base leading-loose text-offwhite/80">{c.text}</p>

          <ul className="mt-6 space-y-3">
            {c.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-offwhite/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-navy">
                  <Check size={12} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs text-offwhite/60">{c.note}</p>
        </div>

        <div className="relative">
          <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-gold/25 to-sky/25 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/40">
            <AuditDashboardPreview language={language} />
          </div>
          <p className="relative mt-3 text-center text-xs text-offwhite/50">{c.caption}</p>
        </div>
      </div>
    </section>
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