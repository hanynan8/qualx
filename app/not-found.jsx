"use client";

// app/not-found.jsx — صفحة 404 بنفس تصميم الموقع (عربي/إنجليزي).
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const TEXT = {
  en: {
    title: "We couldn't find that page.",
    text: "The link may be broken, or the page may have been moved.",
    home: "Back to home",
    services: "Explore our services",
  },
  ar: {
    title: "مقدرناش نلاقي الصفحة دي.",
    text: "يمكن الرابط غلط، أو الصفحة اتنقلت لمكان تاني.",
    home: "الرجوع للرئيسية",
    services: "استكشف خدماتنا",
  },
};

export default function NotFound() {
  const { language } = useLanguage();
  const t = TEXT[language] || TEXT.en;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-[#15406E] text-offwhite">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-24 end-[-4rem] h-80 w-80 rounded-full bg-sky/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-[-5rem] start-[-3rem] h-72 w-72 rounded-full bg-gold/15 blur-3xl" />

      <div className="container-content relative flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold text-navy shadow-lg shadow-gold/25">
          <Compass size={30} />
        </span>
        <p className="mt-6 font-display text-8xl font-bold leading-none text-white/10 md:text-9xl" dir="ltr">
          404
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-md text-offwhite/75">{t.text}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className="btn-primary group">
            {t.home}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </Link>
          <Link href="/services" className="btn-secondary">
            {t.services}
          </Link>
        </div>
      </div>
    </section>
  );
}