"use client";

// app/admin/components/accountCard.jsx
//
// كارت الحساب فوق السايدبار (بديل ProfileSettingsCard في Edumaster): اسم
// الأدمن، الإيميل، حالة MFA، وزر تسجيل الخروج.

import { signOut } from "next-auth/react";
import { LogOut, ShieldCheck, ShieldAlert } from "lucide-react";

export default function AccountCard({ user, mfaEnabled }) {
  const initial = (user?.name || user?.email || "A").trim().charAt(0).toUpperCase();
  return (
    <div className="bg-white rounded-2xl shadow-xl p-5 mb-6 border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-lg font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-800" dir="auto">{user?.name || "Admin"}</p>
          <p className="truncate text-xs text-gray-500" dir="ltr">{user?.email || "—"}</p>
        </div>
      </div>
      <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${mfaEnabled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
        {mfaEnabled ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
        MFA {mfaEnabled ? "enabled" : "not enabled"}
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}
