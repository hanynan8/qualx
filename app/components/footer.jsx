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
  brandLetter: "Q",
  links: [
    { id: "home", href: "/" },
    { id: "services", href: "/services" },
    { id: "careers", href: "/careers" },
  ],
  contact: {
    email: "hello@qualx.com",
    phone: "+20 100 000 0000",
    location: "Cairo, Egypt",
  },
  i18n: {
    en: {
      brand: "Qualx",
      description:
        "Quality Assurance & Customer Experience for businesses and branches across Egypt — Mystery Shopping, Auditing, Managed Services, and CX.",
      companyTitle: "Company",
      contactTitle: "Contact",
      links: { home: "Home", services: "Services", careers: "Careers" },
    },
    ar: {
      brand: "Qualx",
      description:
        "ضمان جودة وتجربة عملاء للشركات والفروع في مصر — تسوق سري، زيارات تدقيق، خدمات مُدارة، وتجربة عملاء.",
      companyTitle: "الشركة",
      contactTitle: "تواصل",
      links: { home: "الرئيسية", services: "خدماتنا", careers: "وظائف" },
    },
  },
};

export default function Footer() {
  const { language } = useLanguage();
  const { data } = useCollectionData("footer");

  const footer = data || FALLBACK_FOOTER;
  const t = pickTranslation(footer, language) || FALLBACK_FOOTER.i18n.en;
  const links = footer.links || FALLBACK_FOOTER.links;
  const contact = footer.contact || FALLBACK_FOOTER.contact;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-offwhite/80">
      <div className="container-content grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display text-xl font-semibold text-offwhite">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-gold text-navy">
              {footer.brandLetter || FALLBACK_FOOTER.brandLetter}
            </span>
            {t.brand}
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-offwhite/70">
            {t.description}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gold">
            {t.companyTitle}
          </h3>
          <ul className="space-y-2 text-sm">
            {links.map((link) => (
              <li key={link.id}>
                <Link href={link.href} className="hover:text-gold">
                  {t.links?.[link.id] || link.id}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gold">
            {t.contactTitle}
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Mail size={16} className="text-sky" />
              {contact.email}
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-sky" />
              {contact.phone}
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} className="text-sky" />
              {contact.location}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-offwhite/10 py-6">
        <p className="container-content text-center text-xs text-offwhite/50">
          © {year} {t.brand}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}