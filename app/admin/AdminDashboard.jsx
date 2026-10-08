"use client";

// app/admin/AdminDashboard.jsx
//
// لوحة الأدمن: tabs — كل تاب لصفحة من الموقع (الرئيسية، من نحن، الخدمات،
// الوظائف) أو للناف بار أو الفوتر، + رسائل الزوار + مستكشف لأي كولكشن تاني +
// الأمان. كل التعديلات بتتحفظ في مونجو عن طريق /api/admin/content والموقع
// بيقراها مباشرة (من غير إعادة نشر).

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Home,
  Info,
  Layers,
  Briefcase,
  PanelTop,
  PanelBottom,
  Inbox,
  Database,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Plus,
} from "lucide-react";
import CollectionManager from "./CollectionManager";
import { api } from "./adminUtils";
import { TABS, DEDICATED_COLLECTIONS } from "./tabsConfig";

const ICONS = {
  home: Home,
  about: Info,
  services: Layers,
  careers: Briefcase,
  navbar: PanelTop,
  footer: PanelBottom,
  messages: Inbox,
  collections: Database,
  security: ShieldCheck,
};

const COLLECTION_NAME_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

// ───────────────────────── explorer: أي كولكشن تاني ─────────────────────────
function Explorer({ onDirtyChange }) {
  const [collections, setCollections] = useState(null);
  const [selected, setSelected] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api("/api/admin/content")
      .then((data) => {
        if (cancelled) return;
        const others = data.collections.filter((c) => !DEDICATED_COLLECTIONS.has(c.name));
        setCollections(others);
        setSelected((cur) => cur || others[0]?.name || "");
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function startNew() {
    const name = newName.trim();
    if (!COLLECTION_NAME_REGEX.test(name)) return setError("اسم الكولكشن: حروف إنجليزي/أرقام/شرطة فقط (حتى 64)");
    if (name === "auth" || name === "audit_logs") return setError("الكولكشن ده محمي");
    setError("");
    setCollections((prev) => (prev.some((c) => c.name === name) ? prev : [...prev, { name, count: 0 }]));
    setSelected(name);
    setNewName("");
  }

  if (!collections && !error) return <p className="py-10 text-center text-sm text-charcoal/50">جاري التحميل...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-charcoal/10 bg-white p-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm"
          dir="ltr"
        >
          {(collections || []).length === 0 && <option value="">(مفيش كولكشنز تانية)</option>}
          {(collections || []).map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
        <span className="mx-1 hidden h-6 w-px bg-charcoal/10 sm:block" />
        <input
          dir="ltr"
          placeholder="اسم كولكشن جديد"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && startNew()}
          className="rounded-lg border border-charcoal/15 px-3 py-2 text-sm"
        />
        <button type="button" onClick={startNew} className="flex items-center gap-1.5 rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-offwhite hover:bg-navy/90">
          <Plus size={14} /> كولكشن جديد
        </button>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {selected && (
        <CollectionManager
          key={`${selected}:${reloadKey}`}
          collection={selected}
          mode="list"
          tab={{}}
          onDirtyChange={onDirtyChange}
        />
      )}
    </div>
  );
}

// ───────────────────────── security ─────────────────────────
function SecurityPanel({ user, mfaEnabled }) {
  return (
    <div className="max-w-md rounded-2xl border border-charcoal/10 bg-white p-6 shadow-lg shadow-navy/5">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${mfaEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {mfaEnabled ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
        </span>
        <h2 className="font-display text-lg font-semibold text-navy">أمان الحساب</h2>
      </div>
      <p className="mt-4 text-sm text-charcoal/70">
        مسجّل دخول باسم <strong className="text-navy">{user.name}</strong> ({user.email || "بدون إيميل"})
      </p>
      <p className="mt-2 text-sm text-charcoal/70">
        المصادقة الثنائية:{" "}
        <strong className={mfaEnabled ? "text-green-700" : "text-red-600"}>{mfaEnabled ? "مفعّلة" : "غير مفعّلة"}</strong>
      </p>
      {!mfaEnabled && (
        <p className="mt-3 rounded-xl bg-offwhite px-3 py-2 text-xs text-charcoal/60">
          شغّل <code dir="ltr">node scripts/setup-mfa.mjs your@email.com</code> لتفعيلها.
        </p>
      )}
      <p className="mt-4 text-xs text-charcoal/50">كل تعديل بتعمله من اللوحة بيتسجّل في audit_logs (إنشاء/تعديل/حذف + الكولكشن + الـ IP).</p>
    </div>
  );
}

// ───────────────────────── dashboard ─────────────────────────
export default function AdminDashboard({ user, mfaEnabled }) {
  const [activeId, setActiveId] = useState(TABS[0].id);
  const dirtyRef = useRef(false);
  const [dirty, setDirty] = useState(false);

  const onDirtyChange = useCallback((v) => {
    dirtyRef.current = v;
    setDirty(v);
  }, []);

  // التاب النشط بيتحفظ في الـ hash (#services) عشان refresh/لينك مباشر.
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === fromHash)) setActiveId(fromHash);
  }, []);

  // تحذير قبل ما المتصفح يقفل/يعمل refresh والفيه تعديلات غير محفوظة.
  useEffect(() => {
    const handler = (e) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  function selectTab(id) {
    if (id === activeId) return;
    if (dirtyRef.current && !window.confirm("فيه تعديلات غير محفوظة في التاب ده. تسيبها وتروح لتاب تاني؟")) return;
    onDirtyChange(false);
    setActiveId(id);
    try {
      window.history.replaceState(null, "", `#${id}`);
    } catch {
      /* مش مشكلة */
    }
  }

  const tab = TABS.find((t) => t.id === activeId) || TABS[0];

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-[#15406E] text-offwhite">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div className="container-content relative flex flex-wrap items-center justify-between gap-4 py-10">
          <div>
            <h1 className="font-display text-3xl font-bold">لوحة التحكم</h1>
            <p className="mt-1 text-sm text-offwhite/75">
              أهلاً <strong className="text-gold">{user.name}</strong> — عدّل محتوى الموقع كله من هنا، والتغييرات بتظهر فورًا.
            </p>
          </div>
          <Link href="/" target="_blank" className="flex items-center gap-1.5 rounded-xl border border-white/25 px-4 py-2 text-sm font-medium text-offwhite hover:border-gold hover:text-gold">
            <ExternalLink size={15} /> فتح الموقع
          </Link>
        </div>
      </section>

      {/* tabs */}
      <div className="sticky top-20 z-30 border-b border-charcoal/10 bg-white/95 backdrop-blur xl:top-24">
        <div className="container-content">
          <div role="tablist" aria-label="أقسام لوحة التحكم" className="-mb-px flex gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = ICONS[t.id] || Layers;
              const active = t.id === activeId;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => selectTab(t.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
                    active ? "border-gold text-navy" : "border-transparent text-charcoal/60 hover:text-navy"
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                  {active && dirty && <span aria-label="تعديلات غير محفوظة" className="h-2 w-2 rounded-full bg-amber-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section role="tabpanel" className="container-content py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy">{tab.label}</h2>
            {tab.hint && <p className="mt-1 text-sm text-charcoal/60">{tab.hint}</p>}
          </div>
          {tab.href && (
            <Link href={tab.href} target="_blank" className="flex items-center gap-1.5 text-sm font-medium text-sky hover:underline">
              <ExternalLink size={14} /> فتح الصفحة
            </Link>
          )}
        </div>

        {tab.mode === "security" ? (
          <SecurityPanel user={user} mfaEnabled={mfaEnabled} />
        ) : tab.mode === "explorer" ? (
          <Explorer onDirtyChange={onDirtyChange} />
        ) : (
          <CollectionManager
            key={tab.id}
            tab={tab}
            collection={tab.collection}
            mode={tab.mode}
            onDirtyChange={onDirtyChange}
          />
        )}
      </section>
    </div>
  );
}
