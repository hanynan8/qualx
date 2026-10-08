// components/Footer.jsx
"use client";

import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCollectionData, pickTranslation } from "../lib/useCollectionData";

// 🔄 DYNAMIC: بيانات الفوتر (اسم الشركة، اللينكات، بيانات التواصل) دلوقتي
// جايه من كولكشن "footer" في مونجو، مش hardcoded. الـ FALLBACK بيحافظ على
// نفس المحتوى الحالي لحد ما تتعمل seed للكولكشن.
const FALLBACK_FOOTER = {
  links: [
    { id: "home", href: "/" },
    { id: "about", href: "/about" },
    { id: "services", href: "/services" },
    { id: "careers", href: "/careers" },
  ],
  contact: {
    email: "hello@merlix.com",
    phone: "+20 100 000 0000",
    location: "Cairo, Egypt",
  },
  i18n: {
    en: {
      brand: "Merlix",
      description:
        "Quality Assurance & Customer Experience for businesses and branches across Egypt — Mystery Shopping, Auditing, Managed Services, and CX.",
      companyTitle: "Company",
      contactTitle: "Contact",
      links: { home: "Home", about: "About us", services: "Services", careers: "Careers" },
    },
    ar: {
      brand: "Merlix",
      description:
        "ضمان جودة وتجربة عملاء للشركات والفروع في مصر — تسوق سري، زيارات تدقيق، خدمات مُدارة، وتجربة عملاء.",
      companyTitle: "الشركة",
      contactTitle: "تواصل",
      links: { home: "الرئيسية", about: "من نحن", services: "خدماتنا", careers: "وظائف" },
    },
  },
};

export default function Footer() {
  const { language } = useLanguage();
  const { data } = useCollectionData("footer");

  const footer = data || FALLBACK_FOOTER;
  const t = pickTranslation(footer, language) || FALLBACK_FOOTER.i18n.en;
  const baseLinks = footer.links || FALLBACK_FOOTER.links;
  const links = baseLinks.some((l) => l.id === "about" || l.href === "/about")
    ? baseLinks
    : [baseLinks[0], { id: "about", href: "/about" }, ...baseLinks.slice(1)].filter(Boolean);
  const ABOUT_LABEL = { en: "About us", ar: "من نحن" };
  const contact = footer.contact || FALLBACK_FOOTER.contact;
  const year = new Date().getFullYear();

  const isAr = language === "ar";
  const rights = isAr ? "جميع الحقوق محفوظة." : "All rights reserved.";

  return (
    <footer className="relative overflow-hidden bg-navy text-offwhite/80">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -top-24 end-[-4rem] h-64 w-64 rounded-full bg-sky/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-[-5rem] start-[-3rem] h-56 w-56 rounded-full bg-gold/10 blur-3xl" />

      <div className="container-content relative grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 font-display text-xl font-bold text-offwhite">
            {t.brand}
          </div>
          <p className="mt-5 max-w-sm text-sm leading-loose text-offwhite/70">{t.description}</p>
        </div>

        <div>
          <h3 className="mb-5 font-display text-base font-semibold text-gold">{t.companyTitle}</h3>
          <span className="mb-5 block h-0.5 w-8 rounded-full bg-gold/60" />
          <ul className="space-y-3 text-sm">
            {links.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-gold rtl:hover:-translate-x-1"
                >
                  {t.links?.[link.id] || (link.id === "about" ? ABOUT_LABEL[language] || ABOUT_LABEL.en : link.id)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 font-display text-base font-semibold text-gold">{t.contactTitle}</h3>
          <span className="mb-5 block h-0.5 w-8 rounded-full bg-gold/60" />
          <ul className="space-y-4 text-sm">
            <li>
              <a href={`mailto:${contact.email}`} className="group flex items-center gap-3 hover:text-gold">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sky transition-colors group-hover:bg-gold group-hover:text-navy">
                  <Mail size={16} />
                </span>
                <span dir="ltr">{contact.email}</span>
              </a>
            </li>
            <li>
              <a
                href={`tel:${String(contact.phone || "").replace(/\s+/g, "")}`}
                className="group flex items-center gap-3 hover:text-gold"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sky transition-colors group-hover:bg-gold group-hover:text-navy">
                  <Phone size={16} />
                </span>
                <span dir="ltr">{contact.phone}</span>
              </a>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sky">
                <MapPin size={16} />
              </span>
              {contact.location}
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10 py-6">
        <p className="container-content text-center text-xs text-offwhite/50">
          © {year} {t.brand}. {rights}
        </p>
      </div>
    </footer>
  );
}