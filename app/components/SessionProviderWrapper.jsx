"use client";

// app/components/SessionProviderWrapper.jsx
//
// next-auth's <SessionProvider> نفسه "use client" أصلًا، لكن بنغلفه هنا
// عشان app/layout.jsx (Server Component) يقدر يعمل getServerSession()
// على السيرفر ويمرر الجلسة الجاهزة كـ prop. الفايدة: useSession() في أي
// كومبوننت تحت (زي Navbar) بيلاقي حالة تسجيل الدخول *فورًا* من أول render
// من غير وميض "مش مسجل دخول" لحظة قبل ما جافاسكريبت العميل يجيب الجلسة
// من /api/auth/session.
import { SessionProvider } from "next-auth/react";

export default function SessionProviderWrapper({ session, children }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}