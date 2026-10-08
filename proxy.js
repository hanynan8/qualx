// proxy.js  (اسمه middleware.js في Next 15 وأقدم — من Next 16 اتغير لـ proxy.js)
//
// طبقتين:
//  1) حماية المسارات حسب الـ role قبل ما الصفحة تتحمّل (defense-in-depth).
//     ⚠️ getToken() بيفك كوكي الـ JWT زي ما هو من غير ما يفحص الداتابيز، فالحساب
//     الموقوف/اللي اتغيرت صلاحيته ممكن يعدي من هنا لحد ~60 ثانية. الفحص
//     الصارم الفوري موجود في requireRole() (rbac.js) وفي صفحة /admin نفسها.
//  2) Security headers على كل الردود.

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ADMIN_AUTH_DISABLED } from "./app/lib/devBypass";

const PAGE_ROLE_RULES = [{ prefix: "/admin", roles: ["admin"] }];
const API_ROLE_RULES = [{ prefix: "/api/admin", roles: ["admin"] }];

function jsonError(status, error) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const isApiPath = pathname.startsWith("/api/");
  const rules = isApiPath ? API_ROLE_RULES : PAGE_ROLE_RULES;
  const rule = rules.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));

  if (rule && !ADMIN_AUTH_DISABLED) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    });

    if (!token || token.invalid) {
      if (isApiPath) return jsonError(401, "unauthorized");
      // مش مسجل دخول → صفحة الدخول، وبعد الدخول يرجع للصفحة اللي كان رايحلها.
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    if (!rule.roles.includes(token.role)) {
      return isApiPath ? jsonError(403, "forbidden") : NextResponse.redirect(new URL("/", request.url));
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // CSP مبني على اللي الموقع بيستخدمه فعلًا (صور من cdn.jsdelivr.net بس، من
  // next.config.mjs). لو ضفت خدمة خارجية (خطوط جوجل، analytics...) ضيف نطاقها
  // للـ directive المناسبة هنا. 'unsafe-eval' في dev بس (Turbopack/React DevTools).
  const isDev = process.env.NODE_ENV !== "production";
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https://cdn.jsdelivr.net https://images.unsplash.com https://raw.githubusercontent.com/hanynan8/merlix-files/",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};