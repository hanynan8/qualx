// app/admin/page.jsx
//
// لوحة تحكم مبدئية للأدمن — نقطة الوصول بعد تسجيل الدخول، وبتثبت إن الحماية
// شغالة. الفحص هنا على السيرفر عن طريق getServerSession (صارم: بيتحقق من
// الداتابيز)، فوق طبقة proxy.js. ضيف أقسام الإدارة بتاعتك جواها بعدين.

import { redirect } from "next/navigation";
import { ShieldCheck, ShieldAlert, UserCircle2 } from "lucide-react";
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
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-[#15406E] text-offwhite">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div aria-hidden className="pointer-events-none absolute -top-24 end-[-4rem] h-72 w-72 rounded-full bg-sky/20 blur-3xl" />
        <div className="container-content relative flex flex-wrap items-center gap-5 py-14">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold text-navy shadow-lg shadow-gold/25">
            <UserCircle2 size={28} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold">Admin dashboard</h1>
            <p className="mt-1 text-sm text-offwhite/75">
              Signed in as <strong className="text-gold">{session.user.name}</strong> (
              {session.user.email || "no email"})
            </p>
          </div>
        </div>
      </section>

      <section className="container-content py-12">
        <div className="max-w-md rounded-2xl border border-charcoal/10 bg-white p-6 shadow-lg shadow-navy/5">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                mfaEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}
            >
              {mfaEnabled ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
            </span>
            <h2 className="font-display text-lg font-semibold text-navy">Account security</h2>
          </div>
          <p className="mt-4 text-sm text-charcoal/70">
            Two-factor authentication:{" "}
            <strong className={mfaEnabled ? "text-green-700" : "text-red-600"}>
              {mfaEnabled ? "enabled" : "not enabled"}
            </strong>
          </p>
          {!mfaEnabled && (
            <p className="mt-3 rounded-xl bg-offwhite px-3 py-2 text-xs text-charcoal/60">
              Run <code dir="ltr">node scripts/setup-mfa.mjs your@email.com</code> to enable it.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}