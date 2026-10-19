// app/dashboard/mystery-shopping/layout.jsx
//
// فحص الصلاحية على السيرفر (طبقة تانية بعد proxy.js). الفحص هنا صارم لأن
// getServerSession بيمر على jwt callback اللي بيتحقق من الداتابيز.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/authOptions";
import { ADMIN_AUTH_DISABLED, DEV_ADMIN_USER } from "../../lib/devBypass";
import {
  canAccessMysteryDashboard,
  MYSTERY_DASHBOARD_PATH,
  MYSTERY_SERVICE_PATH,
} from "../../lib/dashboardAccess";

export const metadata = { title: "Mystery Shopping Dashboard — Qualx" };

export default async function MysteryDashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  const user = session?.user || (ADMIN_AUTH_DISABLED ? DEV_ADMIN_USER : null);

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(MYSTERY_DASHBOARD_PATH)}`);
  }
  if (!canAccessMysteryDashboard(user)) {
    redirect(MYSTERY_SERVICE_PATH);
  }
  return children;
}
