# نظام تسجيل الدخول — Qualx

مبني على نفس أساس Edumaster: **NextAuth (JWT) + MongoDB/Mongoose + bcrypt**، مع rate limiting وقفل حسابات وMFA.

## الإعداد (مرة واحدة)

1. انسخ `.env.example` إلى `.env.local` وعبّي `MONGODB_URI` و`NEXTAUTH_SECRET` (`openssl rand -base64 32`) و`NEXTAUTH_URL`.
2. `npm install`
3. اعمل أول أدمن: `node scripts/make-admin.mjs admin@qualx.com`
4. فعّل MFA له: `node scripts/setup-mfa.mjs admin@qualx.com` (امسح الـ QR واحفظ الأكواد الاحتياطية)
5. ادخل من `/login` — الأدمن بيتحوّل تلقائيًا لـ `/admin`. الزوار بينشئوا حساب من `/register` (وبيدخلوا تلقائيًا بعدها).

## إنشاء الحسابات

- **زوار الموقع:** `/register` (الاسم، الإيميل، الموبايل، الباسورد 8+ أحرف) ← دخول تلقائي. الحساب الجديد دايمًا `role: "user"` بدون أي صلاحيات إدارية.
- **الأدمن:** بالسكريبت بس (تحت). مفيش أي طريقة لعمل أدمن من الموقع.
- **قفل التسجيل:** ضع `REGISTRATION_ENABLED=false` في الـ env لو اتعمل سبام.
- **قواعد:** الاسم ماينفعش يحتوي `@` (عشان تسجيل الدخول بيفرّق بين الإيميل والاسم بوجودها). حد التسجيل 5 حسابات / ساعة لكل IP.

## إدارة الحسابات

| المهمة | الأمر |
|---|---|
| إنشاء أدمن / ترقية حساب / تغيير باسورد | `node scripts/make-admin.mjs <email>` |
| تفعيل MFA | `node scripts/setup-mfa.mjs <email>` |
| إلغاء MFA (ضاع الموبايل) | `node scripts/setup-mfa.mjs <email> --disable` |
| إيقاف حساب | في Mongo: `status: "suspended"` ثم زوّد `tokenVersion` |
| إبطال كل جلسات حساب | في Mongo: زوّد `tokenVersion` بواحد |

## طبقات الحماية

- **Rate limit للـ IP**: 10 محاولات / 15 دقيقة (Upstash Redis لو متظبط، وإلا ذاكرة).
- **قفل الحساب**: 5 محاولات فاشلة خلال 15 دقيقة ← قفل 15 دقيقة (محفوظ في الداتابيز).
- **رسائل موحّدة**: حساب مش موجود = باسورد غلط (نفس الشكل ونفس التوقيت تقريبًا).
- **MFA (TOTP)** للأدمن + 8 أكواد احتياطية بتتستخدم مرة واحدة.
- **إبطال الجلسات**: تغيير الباسورد/الـ role أو إيقاف الحساب بيبطّل الجلسة خلال ~60 ثانية (`tokenVersion`).
- **الـ role من الداتابيز فقط** — مفيش أي مقارنة إيميل في الكود.
- **باسوردات قديمة plain-text** بتترقّى تلقائيًا لـ bcrypt أول ما صاحبها يدخل.
- **`proxy.js`**: حماية `/admin` و`/api/admin/*` + Security headers + CSP.
- **`requireRole(["admin"])`** في `app/lib/rbac.js` لأي API route جديد (الفحص الصارم من الداتابيز).
- **`audit_logs`**: دخول ناجح، فشل MFA، قفل حساب. الكولكشن ده (وكولكشن `auth`) ممنوعين من `/api/data`.

## إضافة route محمي

```js
import { requireRole } from "@/app/lib/rbac";

export async function POST(request) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response; // 401 / 403
  // auth.session.user = { id, name, email, role }
}
```

## ملاحظات

- `mfaSecret` متخزّن كما هو في الداتابيز (زي Edumaster) — احمِ الوصول للداتابيز.
- الـ IP مأخوذ من `x-forwarded-for`؛ ده آمن ورا Vercel/Nginx، مش لو السيرفر مكشوف مباشرة.
- عند نشر الموقع على دومين جديد: عدّل `NEXTAUTH_URL`، ولو ضفت خدمة خارجية (خطوط/analytics) ضيفها في CSP جوه `proxy.js`.
