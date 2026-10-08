"use client";

// app/admin/components/PanelFrame.jsx
//
// الإطار المشترك لتابات الصفحات في الأدمن (نفس هيدر Edumaster): كارت أبيض
// بحواف مدورة، هيدر بتدرّج أزرق/بنفسجي فاتح فيه الأيقونة والعنوان والأزرار.

export default function PanelFrame({ icon: Icon, title, actions, children, bodyClassName = "p-6 space-y-6" }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100">
      <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-2xl font-semibold flex items-center gap-3 text-blue-900">
            {Icon && <Icon size={28} />}
            {title}
          </h2>
          {actions && <div className="flex gap-3 flex-wrap">{actions}</div>}
        </div>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
