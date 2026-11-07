"use client";

// app/admin/components/settingsPanel.jsx — إعدادات المنصة: فتح/قفل التسجيل (الموقع وبوابة الكارير).
// لو التسجيل مقفول من الـ env (REGISTRATION_ENABLED=false / CAREER_REGISTRATION_ENABLED=false) بيظهر هنا
// كـ "مقفول من الاستضافة" ومايتغيّرش من اللوحة.

import { useCallback, useEffect, useState } from "react";
import { Settings, UserPlus, Briefcase, Lock } from "lucide-react";
import PanelFrame, { Banner, Spinner } from "./PanelFrame";
import { api } from "../adminUtils";

const ITEMS = [
  {
    key: "siteRegistrationEnabled",
    icon: UserPlus,
    title: "Website sign-up",
    desc: "السماح بإنشاء حسابات جديدة على الموقع (/register). الحسابات الموجودة مش بتتأثر.",
  },
  {
    key: "careerRegistrationEnabled",
    icon: Briefcase,
    title: "Career portal sign-up",
    desc: "السماح للفريلانسرز بإنشاء حسابات جديدة في بوابة الكارير. الحسابات الموجودة مش بتتأثر.",
  },
];

export default function SettingsPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api("/api/admin/settings"));
    } catch (err) {
      setError(`تعذّر تحميل الإعدادات: ${err.message}`);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function toggle(key) {
    setSaving(key);
    setError("");
    try {
      setData(await api("/api/admin/settings", { method: "PATCH", body: JSON.stringify({ [key]: !data.settings[key] }) }));
    } catch (err) {
      setError(`فشل الحفظ: ${err.message}`);
    } finally {
      setSaving("");
    }
  }

  return (
    <PanelFrame icon={Settings} title="Platform Settings" subtitle="تحكّم في فتح وقفل التسجيل على المنصة">
      {error && <Banner type="error">{error}</Banner>}
      {!data && !error ? (
        <Spinner />
      ) : (
        data && (
          <div className="max-w-2xl space-y-4">
            {ITEMS.map(({ key, icon: Icon, title, desc }) => {
              const locked = data.envLocked?.[key];
              const on = data.settings[key] && !locked;
              return (
                <div key={key} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${on ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    <Icon size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-500">{desc}</p>
                    {locked && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <Lock size={12} /> مقفول من إعدادات الاستضافة (env) — شيله من هناك الأول.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={title}
                    disabled={!!saving || locked}
                    onClick={() => toggle(key)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${on ? "bg-emerald-500" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
            <div className={`rounded-2xl border p-5 ${data.emailConfigured ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              <h3 className="font-semibold text-gray-800">Email notifications (Resend)</h3>
              <p className="mt-1 text-sm text-gray-600">
                {data.emailConfigured
                  ? "مفعّلة — بيتبعت إيميل للفريلانسر عند قبول/رفض الطلب، تغيير الباسورد، وإيقاف/تفعيل الحساب."
                  : "مش مفعّلة. ضيف RESEND_API_KEY و EMAIL_FROM في متغيرات البيئة عشان الإيميلات تشتغل."}
              </p>
            </div>
            <p className="text-xs text-gray-400">كل تغيير بيتسجّل في Audit Log.</p>
          </div>
        )
      )}
    </PanelFrame>
  );
}
