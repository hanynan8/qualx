"use client";

// app/admin/components/securityPanel.jsx — حالة الحساب والمصادقة الثنائية.

import { ShieldCheck, ShieldAlert } from "lucide-react";
import PanelFrame from "./PanelFrame";

export default function SecurityPanel({ user, mfaEnabled }) {
  return (
    <PanelFrame icon={ShieldCheck} title="Account & Security" subtitle="حالة حسابك والمصادقة الثنائية (MFA)">
      <div className="max-w-xl rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${mfaEnabled ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {mfaEnabled ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Two-Factor Authentication</h3>
            <p className={`text-sm font-semibold ${mfaEnabled ? "text-emerald-600" : "text-red-600"}`}>{mfaEnabled ? "مفعّلة" : "غير مفعّلة"}</p>
          </div>
        </div>
        <p className="mt-5 text-sm text-gray-600">
          مسجّل دخول باسم <strong className="text-gray-800">{user.name}</strong> ({user.email || "بدون إيميل"})
        </p>
        {!mfaEnabled && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
            شغّل <code dir="ltr">node scripts/setup-mfa.mjs your@email.com</code> لتفعيلها.
          </p>
        )}
        <p className="mt-5 text-xs text-gray-400">كل تعديل بتعمله من اللوحة بيتسجّل (إنشاء/تعديل/حذف + الكولكشن + الـ IP).</p>
      </div>
    </PanelFrame>
  );
}
