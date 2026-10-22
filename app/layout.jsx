// app/layout.jsx
import "./globals.css";
// 🔤 خط Cairo (عربي + إنجليزي) من حزمة npm بدل next/font/google:
// بيتخدم من نفس الدومين، ومش بيحتاج اتصال بـ Google وقت الـ build/dev.
import "@fontsource-variable/cairo";
// 🐛 كان فيه هنا "./components/Navbar" / "./components/Footer" بحرف
// كبير، والملفات فعليًا اسمها navbar.jsx / footer.jsx — بيفشل على أي
// نشر Linux (Vercel). متصلح.
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { LanguageProvider } from "../contexts/LanguageContext";
import SessionProviderWrapper from "./components/SessionProviderWrapper";
import ScrollReveal from "./components/ScrollReveal";
import SiteChrome from "./components/SiteChrome";
import ContactFormProvider from "./components/ContactFormProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "../app/lib/authOptions";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_CONTACT,
  SITE_THEME_COLOR,
} from "./lib/siteConfig";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "business",
  alternates: { canonical: "/" },
  formatDetection: { email: false, address: false, telephone: false },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    alternateLocale: ["ar_EG"],
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport = {
  themeColor: SITE_THEME_COLOR,
  width: "device-width",
  initialScale: 1,
};

// بيانات منظّمة (Schema.org) عشان جوجل يفهم إن ده كيان شركة.
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  image: `${SITE_URL}/og-image.png`,
  description: SITE_DESCRIPTION,
  email: SITE_CONTACT.email,
  telephone: SITE_CONTACT.phone,
  address: { "@type": "PostalAddress", addressLocality: SITE_CONTACT.city, addressCountry: SITE_CONTACT.country },
  areaServed: "EG",
  sameAs: [SITE_CONTACT.facebook, SITE_CONTACT.linkedin],
};

// 🔐 نظام تسجيل الدخول: بنجيب الجلسة على السيرفر (مرة واحدة لكل طلب صفحة)
// ونمررها لـ SessionProviderWrapper، عشان Navbar (وأي كومبوننت تحته)
// يعرف فورًا لو المستخدم مسجل دخول أو لأ من غير ما يستنى طلب إضافي.
export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="font-sans flex min-h-screen flex-col bg-offwhite text-charcoal antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <SessionProviderWrapper session={session}>
          <LanguageProvider>
            <ContactFormProvider>
              <SiteChrome>
                <Navbar />
              </SiteChrome>
              <main className="flex-1">{children}</main>
              <SiteChrome>
                <Footer />
              </SiteChrome>
              <ScrollReveal />
            </ContactFormProvider>
          </LanguageProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}