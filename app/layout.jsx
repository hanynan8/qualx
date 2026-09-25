import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { LanguageProvider } from "../contexts/LanguageContext";

export const metadata = {
  title: "Qualx — Quality Assurance & Customer Experience",
  description:
    "Qualx evaluates customer experience and quality control for businesses across Egypt through Mystery Shopping, Auditing, Managed Services, and CX consulting.",
};

// 🔄 DYNAMIC: كان بيجيب company من lib/data.jsx (ستاتيك) ويمررها كـ props
// لـ Navbar/Footer. دلوقتي Navbar وFooter بقوا client components وبيجيبوا
// بياناتهم بنفسهم من /api/data?collection=navbar و /api/data?collection=footer
// (نفس فكرة edumaster)، فمبقاش محتاجين نجيب حاجة هنا خالص — الـ layout
// رجع بسيط ومسؤوليته الوحيدة إنه يلف الموقع بـ LanguageProvider.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-offwhite text-charcoal antialiased">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}