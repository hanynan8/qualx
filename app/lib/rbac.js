// app/lib/rbac.js
//
// هيلبر موحّد للتحقق من الصلاحيات جوه أي API route. الاستخدام:
//
//   import { requireRole } from "@/app/lib/rbac";
//
//   export async function POST(request) {
//     const auth = await requireRole(["admin"]);
//     if (auth.response) return auth.response;   // 401 أو 403 جاهزين
//     const { session } = auth;
//     ...
//   }
//
// ده الفحص الصارم: بيعدي على getServerSession → jwt callback اللي بيتحقق من
// الداتابيز (موقوف؟ tokenVersion اتغير؟ role اتغير؟). proxy.js طبقة إضافية
// قبل كده بس، مش بديل عن الفحص ده.

import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, response: jsonResponse({ error: "unauthorized" }, 401) };
  }
  return { session, response: null };
}

// 401 = مش مسجل دخول، 403 = مسجل لكن الـ role مالوش صلاحية.
export async function requireRole(allowedRoles) {
  const base = await requireSession();
  if (base.response) return base;
  if (!allowedRoles.includes(base.session.user.role)) {
    return { session: null, response: jsonResponse({ error: "forbidden" }, 403) };
  }
  return { session: base.session, response: null };
}
