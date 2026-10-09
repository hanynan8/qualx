"use client";

// app/lib/useContactEmail.js
//
// مصدر واحد لزراير "اطلب عرض سعر / تواصل معانا / اسأل عن الخدمة".
// مفيش صفحة تواصل في الموقع، فالزراير دي بتفتح إيميل جاهز للإيميل اللي في
// كولكشن "footer" (contact.email) — نفس الإيميل المعروض في الفوتر. لو الكولكشن
// لسه ما اتحمّلش أو مفيهوش إيميل بنستخدم DEFAULT_CONTACT_EMAIL.

import { useCollectionData } from "./useCollectionData";

export const DEFAULT_CONTACT_EMAIL = "Merilex.Consulting@gmail.com";

export function useContactEmail() {
  const { data } = useCollectionData("footer");
  return data?.contact?.email || DEFAULT_CONTACT_EMAIL;
}

const SUBJECTS = {
  quote: { en: "Quote request", ar: "طلب عرض سعر" },
  contact: { en: "Inquiry", ar: "استفسار" },
  service: { en: "Inquiry about", ar: "استفسار عن" },
};

// mailtoHref(email, "quote", "ar")  |  mailtoHref(email, "service", "en", "Auditing Visits")
export function mailtoHref(email, kind, language = "en", extra = "") {
  const base = (SUBJECTS[kind] || SUBJECTS.contact)[language] || (SUBJECTS[kind] || SUBJECTS.contact).en;
  const subject = extra ? `${base}: ${extra}` : base;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
