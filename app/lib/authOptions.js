// app/lib/authOptions.js
//
// ❌ المشكلة اللي كانت موجودة: app/api/data/route.js بيعمل
//    import { authOptions } from "@/app/lib/authOptions";
// لكن الإعدادات فعليًا كانت متعرّفة *جوه*
// app/api/auth/[...nextauth]/route.js بس، ومش متصدّرة من أي مكان تاني.
// في Next.js App Router، ملف route.js مسموح يصدّر بس HTTP methods
// (GET, POST, ...) — أي export تاني زيها authOptions بيتجاهل/يفشل. فلازم
// الإعدادات تكون في ملف منفصل زي ده، ويستوردها الاتنين:
//   - app/api/auth/[...nextauth]/route.js  (NextAuth(authOptions))
//   - app/api/data/route.js                (getServerSession(authOptions))
//
// 🔒 SECURITY FIX (الأهم): بعد ما أمّنّا /api/data وحطينا "auth" في
// PROTECTED_COLLECTIONS (ممنوع أي حد يقراها حتى admin، لازم كود سيرفر
// موثوق بس)، الكود القديم هنا كان بيحاول يجيب المستخدمين عن طريق:
//     fetch(`${baseUrl}/api/data?collection=auth`)
// وده بقى يرجع 403 دايمًا → تسجيل الدخول اتكسر تمامًا (نفس الحاجة
// لترقية الباسورد القديم لـ bcrypt، اللي كانت بتستخدم PATCH لراوت مش
// متعرّف حتى في /api/data أصلًا).
//
// الحل الصح مش إننا نفتح "auth" تاني (ده بالظبط اللي التأمين جاي يمنعه)
// لكن إن authorize() — اللي هو كود سيرفر شغال جوه نفس الـ Next.js process
// أصلًا — يكلم mongoose *مباشرة*، من غير ما يعدي على HTTP ولا على
// /api/data خالص. ده أأمن (الباسوردات ميعديش عليها أي طبقة API عامة)
// وأسرع (مفيش HTTP round-trip داخلي لنفسه).
//
// 🔒 SECURITY FIX #2: authorize() الأصلي كان بيرجع user من غير role، وبعدين
// jwt()/session() مكانوش بينسخوا role للتوكن/الـ session خالص. ده كان
// معناه إن isAdminRequest() في app/api/data/route.js (اللي بيفحص
// session?.user?.role === "admin") هترجع false دايمًا حتى لو كان
// المستخدم admin فعليًا في الداتابيز — يعني كل عمليات الكتابة (POST admin،
// PUT، DELETE) وقراءة الكولكشنز الخاصة كانت هتترفض بـ 401 على طول. اتصلح
// تحت بإضافة role في القيمة الراجعة من authorize() وفي الـ callbacks.
import mongoose from "mongoose";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToMongo } from "../lib/mongodb";

// موديل مخصص لكولكشن "auth" بس — منفصل عمدًا عن الموديلات الديناميكية في
// app/api/data/route.js (اللي أصلًا بترفض تتعامل مع "auth" قبل ما توصل
// لأي موديل). أي كود يحتاج يقرأ/يعدّل بيانات تسجيل الدخول لازم يعدي من
// هنا، مش من الراوت العام.
const authUserSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

function getAuthUserModel() {
  return mongoose.models.AuthUser || mongoose.model("AuthUser", authUserSchema, "auth");
}

async function verifyPassword(inputPassword, storedPassword, userId) {
  const isBcrypt = typeof storedPassword === "string" && storedPassword.startsWith("$2");

  if (isBcrypt) {
    return bcrypt.compare(inputPassword, storedPassword);
  }

  // مسار توافق مؤقت لباسوردات قديمة متخزنة plain-text: لو طابقت، رقّيها
  // لـ bcrypt فورًا في الخلفية عشان محدش يفضل مخزّن plain-text في
  // الداتابيز أكتر من مرة واحدة.
  const isValid = inputPassword === storedPassword;
  if (isValid && userId) {
    upgradePasswordHash(userId, inputPassword).catch((err) =>
      console.error("[auth] password upgrade failed:", err)
    );
  }
  return isValid;
}

async function upgradePasswordHash(userId, plainPassword) {
  const hashed = await bcrypt.hash(plainPassword, 12);
  await connectToMongo();
  const AuthUser = getAuthUserModel();
  await AuthUser.findByIdAndUpdate(userId, {
    password: hashed,
    updatedAt: new Date(),
  });
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        nameOrEmail: { label: "Name or Email", type: "text" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        phone: { label: "Phone", type: "text" },
        address: { label: "Address", type: "text" },
        paymentMethod: { label: "Payment Method", type: "text" },
      },

      async authorize(credentials) {
        if (!credentials?.nameOrEmail && !credentials?.name) return null;

        const identifier = (credentials.nameOrEmail || credentials.name || "")
          .toLowerCase()
          .trim();
        if (!identifier) return null;

        try {
          await connectToMongo();
          const AuthUser = getAuthUserModel();

          // 🔒 SECURITY: بنجيب المستخدمين ونقارن في الكود (JS) بدل ما نبني
          // regex/query من مدخلات المستخدم مباشرة — ده بيمنع أي احتمال
          // NoSQL/regex injection عبر nameOrEmail. عدد حسابات الأدمن/الموظفين
          // صغير، فمفيش أي تكلفة أداء حقيقية.
          const MAX_USERS_SCANNED = 2000;
          const users = await AuthUser.find({}).limit(MAX_USERS_SCANNED).lean();

          const user = users.find(
            (u) =>
              u.name?.toLowerCase().trim() === identifier ||
              u.email?.toLowerCase().trim() === identifier
          );

          if (!user) return null;

          if (credentials.password && user.password) {
            const isValid = await verifyPassword(
              credentials.password,
              user.password,
              user._id?.toString()
            );
            if (!isValid) return null;
          }

          return {
            id: user._id?.toString() || user.name,
            name: user.name,
            role: user.role, // 🔒 لازم تتبعت هنا عشان isAdminRequest() يشتغل
            phone: user.phone || credentials.phone,
            address: user.address || credentials.address,
            paymentMethod: user.paymentMethod || credentials.paymentMethod || "cash",
          };
        } catch (error) {
          console.error("Auth Error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role; // 🔒 كان ناقص — بدونه role مكانتش توصل للـ session خالص
        token.phone = user.phone;
        token.address = user.address;
        token.paymentMethod = user.paymentMethod;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.role = token.role; // 🔒 نفس الحاجة هنا
        session.user.phone = token.phone;
        session.user.address = token.address;
        session.user.paymentMethod = token.paymentMethod;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // url مش absolute صحيح — تجاهله وارجع للـ baseUrl بدل ما تكسر
      }
      return baseUrl;
    },
  },

  debug: process.env.NODE_ENV === "development",
};

export default authOptions;