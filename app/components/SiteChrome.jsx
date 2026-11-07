"use client";

// app/components/SiteChrome.jsx
//
// لوحة الأدمن (/admin) ليها هيدر وسايدبار خاصين بيها (زي أدمن Edumaster)،
// فبنخفي ناف بار وفوتر الموقع العاديين هناك. أي صفحة تانية بتتعرض عادي.

import { usePathname } from "next/navigation";

export default function SiteChrome({ children }) {
  const pathname = usePathname() || "";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  // داشبورد العملاء ليها سايدبار وهيدر خاصين بيها.
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return null;
  // بوابة الكارير (لوجن + داشبورد) ليها واجهتها الخاصة ومن غير ناف بار/فوتر الموقع.
  if (pathname === "/career-dashboard" || pathname.startsWith("/career-dashboard/")) return null;
  return children;
}
