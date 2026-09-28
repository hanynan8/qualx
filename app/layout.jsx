import "./globals.css";
// 🐛 كان فيه هنا "./components/Navbar" / "./components/Footer" بحرف
// كبير، والملفات فعليًا اسمها navbar.jsx / footer.jsx — بيفشل على أي
// نشر Linux (Vercel). متصلح.
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { LanguageProvider } from "../contexts/LanguageContext";
import SessionProviderWrapper from "./components/SessionProviderWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "../app/lib/authOptions";

export const metadata = {
  title: "Qualx — Quality Assurance & Customer Experience",
  description:
    "Qualx evaluates customer experience and quality control for businesses across Egypt through Mystery Shopping, Auditing, Managed Services, and CX consulting.",
};

// 🔐 نظام تسجيل الدخول: بنجيب الجلسة على السيرفر (مرة واحدة لكل طلب صفحة)
// ونمررها لـ SessionProviderWrapper، عشان Navbar (وأي كومبوننت تحته)
// يعرف فورًا لو المستخدم مسجل دخول أو لأ من غير ما يستنى طلب إضافي.
export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-offwhite text-charcoal antialiased">
        <SessionProviderWrapper session={session}>
          <LanguageProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </LanguageProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}