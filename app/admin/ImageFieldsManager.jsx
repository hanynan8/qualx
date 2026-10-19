"use client";

// app/admin/ImageFieldsManager.jsx
//
// صور على مستوى الصفحة (مثل هيرو صفحة الخدمات) — كل صورة حقل نصي في الـ
// document (draft[key]) ومعاها معاينة. لو الحقل فاضي الموقع بيرجع للصورة
// الافتراضية (fallback) اللي بنعرضها هنا كـ placeholder.

import { ImageIcon } from "lucide-react";

const inputClass = "w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-500";

export default function ImageFieldsManager({ fields, draft, setDraft }) {
  if (!fields?.length) return null;

  const setValue = (key, value) => setDraft((prev) => ({ ...(prev || {}), [key]: value }));

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-2 border-gray-200">
      <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800">
        <ImageIcon size={20} /> صور الصفحة
      </h3>
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map(({ key, label, fallback }) => {
          const value = typeof draft?.[key] === "string" ? draft[key] : "";
          const shown = value.trim() || fallback || "";
          const isFallback = !value.trim() && !!fallback;
          return (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-semibold">{label}</label>
              <input
                dir="ltr"
                type="text"
                value={value}
                placeholder={fallback || "https://..."}
                onChange={(e) => setValue(key, e.target.value)}
                className={inputClass}
              />
              {shown && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shown}
                  alt="Preview"
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                  className={`h-36 w-full rounded-lg border-2 border-gray-200 object-cover ${isFallback ? "opacity-60" : ""}`}
                />
              )}
              {isFallback && <p className="text-[11px] text-gray-400">فاضي → الموقع بيستخدم الصورة الافتراضية (المعروضة).</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
