// app/dashboard/auditing-visits/layout.jsx
//
// فحص الصلاحية على السيرفر (طبقة تانية بعد proxy.js). الفحص هنا صارم لأن
// getServerSession بيمر على jwt callback اللي بيتحقق من الداتابيز.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/authOptions";
import { ADMIN_AUTH_DISABLED, DEV_ADMIN_USER } from "../../lib/devBypass";
import { canAccessAuditDashboard, AUDIT_DASHBOARD_PATH, AUDIT_SERVICE_PATH } from "../../lib/dashboardAccess";

export const metadata = { title: "Operational Audit Dashboard" };

export default async function AuditDashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  const user = session?.user || (ADMIN_AUTH_DISABLED ? DEV_ADMIN_USER : null);

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(AUDIT_DASHBOARD_PATH)}`);
  }
  if (!canAccessAuditDashboard(user)) {
    redirect(AUDIT_SERVICE_PATH);
  }
  return children;
}
