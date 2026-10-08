"use client";

// contexts/LanguageContext.js
//
// مصدر واحد لتحديد اللغة الحالية (en/ar) في الموقع كله.
// - بيحفظ اختيار المستخدم في localStorage عشان يفضل نفس اللغة لو رجع تاني.
// - بيحدّث dir="rtl"/"ltr" و lang على <html> تلقائيًا، عشان التنسيق
//   (خط، اتجاه، محاذاة) يتغير صح من غير ما كل صفحة تتعامل مع ده لوحدها.
// - أي كومبوننت عايز يعرف اللغة الحالية أو يغيّرها بيستخدم useLanguage().

import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext({
  language: "en",
  changeLanguage: () => {},
});

const STORAGE_KEY = "Merlix";
const SUPPORTED_LANGUAGES = ["en", "ar"];

function getInitialLanguage() {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return SUPPORTED_LANGUAGES.includes(saved) ? saved : "en";
}

export function LanguageProvider({ children }) {
  // نبدأ بـ "en" ثابتة على السيرفر عشان الـ hydration ميحصلش فيه mismatch،
  // وبعدين نحدّثها من localStorage بعد ما الصفحة تفتح في المتصفح.
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    setLanguage(getInitialLanguage());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const changeLanguage = (lang) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    setLanguage(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}