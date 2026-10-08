// app/layout.jsx
import "./globals.css";
import { Cairo } from "next/font/google";
// 🐛 كان فيه هنا "./components/Navbar" / "./components/Footer" بحرف
// كبير، والملفات فعليًا اسمها navbar.jsx / footer.jsx — بيفشل على أي
// نشر Linux (Vercel). متصلح.
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { LanguageProvider } from "../contexts/LanguageContext";
import SessionProviderWrapper from "./components/SessionProviderWrapper";
import ScrollReveal from "./components/ScrollReveal";
import { getServerSession } from "next-auth";
import { authOptions } from "../app/lib/authOptions";

// 🔤 خط Cairo للموقع كله (عربي + إنجليزي). next/font بينزّله وقت الـ build/dev
// ويخدمه من نفس الدومين (self-hosted)، فمفيش تغيير مطلوب في الـ CSP (font-src 'self').
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata = {
  title: "merlix — Quality Assurance & Customer Experience",
  description:
    "merlix evaluates customer experience and quality control for businesses across Egypt through Mystery Shopping, Auditing, Managed Services, and CX consulting.",
};

// 🔐 نظام تسجيل الدخول: بنجيب الجلسة على السيرفر (مرة واحدة لكل طلب صفحة)
// ونمررها لـ SessionProviderWrapper، عشان Navbar (وأي كومبوننت تحته)
// يعرف فورًا لو المستخدم مسجل دخول أو لأ من غير ما يستنى طلب إضافي.
export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={cairo.variable}>
      <body className="font-sans flex min-h-screen flex-col bg-offwhite text-charcoal antialiased">
        <SessionProviderWrapper session={session}>
          <LanguageProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <ScrollReveal />
          </LanguageProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}