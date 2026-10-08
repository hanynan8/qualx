"use client";

// lib/useCollectionData.js
//
// Hook مشترك بيجيب أي كولكشن من الكولكشنز اللي بتحمل content الموقع
// (home, services, careers, navbar, footer) عن طريق /api/data?collection=...
//
// كل واحدة من الكولكشنز دي متخزنة كـ document واحد بس (مش array of docs)،
// والراوت بتاعك بيرجعها كـ array فيه عنصر واحد، فالـ hook بيفكها تلقائيًا.
// بدل ما نكرر نفس منطق fetch/useEffect/unwrap في كل صفحة (زي edumaster اللي
// كل صفحة فيها useHomeData/useNavbarData منفصلين لكن بنفس الكود بالظبط)،
// عاملينها مرة واحدة هنا وكل صفحة بس بتستدعيها بإسم الكولكشن.
//
// الاستخدام:
//   const { data, loading, error } = useCollectionData("home");
//   if (loading) return <Loading />;
//   if (error || !data) return <ErrorState />;

import { useEffect, useState } from "react";

export function useCollectionData(collectionName) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/data?collection=${collectionName}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        const doc = Array.isArray(result) ? result[0] ?? null : result;
        if (!cancelled) setData(doc);
      } catch (err) {
        console.error(`[useCollectionData:${collectionName}]`, err);
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [collectionName]);

  return { data, loading, error };
}

// هيلبر صغير: ياخد الـ doc كامل + اللغة الحالية ويرجع بلوك i18n بتاعها،
// مع fallback للإنجليزي لو اللغة المطلوبة مش موجودة في المستند (زي لو
// حد ضاف لغة في navbar بس نسي يترجم services مثلًا).
export function pickTranslation(doc, language) {
  if (!doc) return null;
  return doc.i18n?.[language] || doc.i18n?.en || null;
}
// 🔄 DYNAMIC page text: النصوص الثابتة في كود الصفحات (PAGE في solutions/
// careers/about) بتتدمج مع override اختياري جاي من الداتابيز
// (doc.i18n.<lang>.page) — يعني الأدمن يقدر يغيّر أي نص منها من لوحة التحكم
// من غير ما حد يعدّل الكود.
//
// القواعد: object بيتدمج مفتاح بمفتاح، array بيتدمج بالـ index (عشان الـ icon
// اللي في الكود يفضل، والنص بس هو اللي يتغير)، وأي قيمة فاضية في الداتابيز
// بتتجاهل وبيفضل النص الافتراضي. المفاتيح اللي مش موجودة في الكود
// بتتضاف زي ما هي.
function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
}

export function mergePageText(base, override) {
  if (override === undefined || override === null || override === "") return base;
  if (Array.isArray(base) && Array.isArray(override)) {
    const merged = base.map((item, i) => (i < override.length ? mergePageText(item, override[i]) : item));
    return override.length > base.length ? merged.concat(override.slice(base.length)) : merged;
  }
  if (isPlainObject(base) && isPlainObject(override)) {
    const merged = { ...base };
    for (const key of Object.keys(override)) merged[key] = mergePageText(base[key], override[key]);
    return merged;
  }
  // base موجود بنوع مختلف (مثلًا component) → سيبه؛ غير كده خد الـ override.
  if (base !== undefined && typeof base === "function") return base;
  return override;
}
