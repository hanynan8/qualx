// app/admin/page.jsx
//
// لوحة تحكم مبدئية للأدمن — نقطة الوصول بعد تسجيل الدخول، وبتثبت إن الحماية
// شغالة. الفحص هنا على السيرفر عن طريق getServerSession (صارم: بيتحقق من
// الداتابيز)، فوق طبقة proxy.js. ضيف أقسام الإدارة بتاعتك جواها بعدين.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/authOptions";
import { connectToMongo, getAuthModel } from "../lib/mongodb";

export const metadata = { title: "Admin — Qualx", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
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
    <div className="container-content py-16">
      <h1 className="font-display text-3xl font-semibold text-navy">Admin dashboard</h1>
      <p className="mt-2 text-charcoal/70">
        Signed in as <strong>{session.user.name}</strong> ({session.user.email || "no email"})
      </p>

      <div className="mt-8 max-w-md rounded-lg border border-charcoal/10 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Account security</h2>
        <p className="mt-2 text-sm text-charcoal/70">
          Two-factor authentication:{" "}
          <strong className={mfaEnabled ? "text-green-700" : "text-red-600"}>
            {mfaEnabled ? "enabled" : "not enabled"}
          </strong>
        </p>
        {!mfaEnabled && (
          <p className="mt-2 text-xs text-charcoal/60">
            Run <code>node scripts/setup-mfa.mjs your@email.com</code> to enable it.
          </p>
        )}
      </div>
    </div>
  );
}
