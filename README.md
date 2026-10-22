# Merilex — Quality Assurance & Customer Experience

موقع Merilex ([www.merilex.online](https://www.merilex.online)) — Next.js (App Router) + MongoDB + NextAuth.

## التشغيل

```bash
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000). متغيرات البيئة وإعداد الأدمن: شوف `AUTH.md`.

## الميتاداتا والـ SEO

- بيانات الشركة (الدومين، الوصف، الكلمات المفتاحية، التواصل): `app/lib/siteConfig.js`
- الميتاداتا الرئيسية + Open Graph + JSON-LD: `app/layout.jsx`
- ميتاداتا الصفحات: `app/(pages)/{about,solutions,careers}/layout.jsx`
- `app/robots.js`، `app/sitemap.js`، `app/manifest.js`
- الأيقونات: `app/favicon.ico`، `app/icon.png`، `app/apple-icon.png` — وصورة المشاركة `public/og-image.png`
