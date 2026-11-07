"use client";

// app/admin/components/PanelFrame.jsx
//
// الإطار المشترك لتابات الأدمن (نفس هيدر Edumaster): كارت أبيض بحواف مدورة،
// هيدر بتدرّج أزرق/بنفسجي فاتح فيه الأيقونة والعنوان والأزرار. بيصدّر كمان
// Banner (رسالة خطأ/نجاح/تنبيه) و Spinner (تحميل) للبانلات.

import { Loader, AlertCircle, CheckCircle2 } from "lucide-react";

export default function PanelFrame({ icon: Icon, title, subtitle, actions, children, bodyClassName = "p-6 space-y-6" }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100">
      <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-3 text-blue-900">
              {Icon && <Icon size={28} />}
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-3 flex-wrap">{actions}</div>}
        </div>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

const BANNER_TONES = {
  error: "bg-red-50 border-red-200 text-red-700",
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

export function Banner({ type = "error", children }) {
  if (!children) return null;
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${BANNER_TONES[type] || BANNER_TONES.error}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="py-12 text-center">
      <Loader className="mx-auto animate-spin text-blue-500" size={40} />
    </div>
  );
}
