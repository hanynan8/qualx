// app/api/auth/[...nextauth]/route.js
//
// كل منطق تسجيل الدخول (authorize, verifyPassword, upgradePasswordHash,
// callbacks...) اتنقل لـ app/lib/authOptions.js عشان يبقى قابل للاستيراد
// من مكان تاني (app/api/data/route.js محتاجه لـ getServerSession)، وده
// مش ممكن لو فضل هنا — App Router بيسمح بس بتصدير GET/POST/... من ملف
// route.js، مش أي export عادي زي authOptions.
import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };