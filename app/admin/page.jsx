// app/admin/page.jsx
//
// لوحة تحكم الأدمن. الفحص هنا على السيرفر عن طريق getServerSession (صارم:
// بيتحقق من الداتابيز)، فوق طبقة proxy.js. الواجهة نفسها (tabs) في
// AdminDashboard.jsx، وكل عملياتها بتمر على /api/admin/content اللي محمي
// بـ requireRole(["admin"]).

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/authOptions";
import { connectToMongo, getAuthModel } from "../lib/mongodb";
import AdminDashboard from "./AdminDashboard";
import { ADMIN_AUTH_DISABLED, DEV_ADMIN_USER } from "../lib/devBypass";

export const metadata = { title: "Admin — Merlix", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // ⚠️ تطوير فقط (شوف app/lib/devBypass.js): من غير تسجيل دخول.
  if (ADMIN_AUTH_DISABLED) {
    return <AdminDashboard user={{ name: DEV_ADMIN_USER.name, email: DEV_ADMIN_USER.email }} mfaEnabled={false} />;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin") redirect("/");

  let mfaEnabled = false;
  try {
    await connectToMongo();
    const me = await getAuthModel().findById(session.user.id, "mfaEnabled").lean();
    mfaEnabled = !!me?.mfaEnabled;
  } catch (err) {
    console.error("[admin] failed to load account info:", err);
  }

  return (
    <AdminDashboard
      user={{ name: session.user.name || "", email: session.user.email || "" }}
      mfaEnabled={mfaEnabled}
    />
  );
}