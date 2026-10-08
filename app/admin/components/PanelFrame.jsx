"use client";

// app/admin/components/PanelFrame.jsx
//
// الإطار المشترك لكل بانل في الأدمن (نفس شكل بانلات Edumaster): كارت أبيض
// بحواف مدورة، هيدر بتدرّج أزرق/بنفسجي فاتح فيه الأيقونة والعنوان والأزرار.

export default function PanelFrame({ icon: Icon, title, subtitle, actions, children, bodyClassName = "p-6 space-y-6" }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100 overflow-hidden">
      <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="min-w-0">
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

export function Banner({ type = "error", children }) {
  const styles = {
    error: "bg-red-500",
    success: "bg-emerald-500",
    info: "bg-blue-500",
  };
  return (
    <div className={`px-6 py-4 rounded-2xl text-white font-medium ${styles[type] || styles.error}`}>{children}</div>
  );
}

export function Spinner({ label = "جاري التحميل..." }) {
  return (
    <div className="py-16 text-center text-gray-400">
      <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
