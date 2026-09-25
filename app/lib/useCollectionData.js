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