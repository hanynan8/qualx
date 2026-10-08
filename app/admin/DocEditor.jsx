"use client";

// app/admin/DocEditor.jsx
//
// محرر document واحد: نموذج حقول (TreeEditor) أو JSON خام، مع حفظ/تجاهل/حذف،
// وكشف التعارض (409) لو الـ document اتعدّل من مكان تاني، وتحذير تغييرات
// غير محفوظة.

import { useEffect, useMemo, useRef, useState } from "react";
import { Save, RotateCcw, Trash2, Eye, EyeOff, FileText, Braces, Wand2 } from "lucide-react";
import TreeEditor from "./TreeEditor";
import ItemsManager from "./ItemsManager";
import { api, clone, fillMissing, splitMeta } from "./adminUtils";
import { LANGS } from "./tabsConfig";
import { PAGE_DEFAULTS } from "./pageDefaults";

const stable = (v) => JSON.stringify(v);

export default function DocEditor({ collection, doc, tab, onSaved, onDeleted, onDirtyChange, allowDelete = false }) {
  const { meta, body } = useMemo(() => splitMeta(doc), [doc]);
  const [draft, setDraft] = useState(() => clone(body));
  const [showAll, setShowAll] = useState(false);
  const [mode, setMode] = useState("form"); // form | json
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "ok" | "error" | "conflict", text }

  // لما الـ document الأصلي يتغير (بعد حفظ/إعادة تحميل) نصفّر المسودة عليه.
  const docVersion = `${meta._id}:${meta.updatedAt}`;
  useEffect(() => {
    setDraft(clone(body));
    setMode("form");
    setJsonError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docVersion]);

  const dirty = stable(draft) !== stable(body);
  // الـ callback بيتحفظ في ref عشان تغيّر هويته مع كل render عند الأب ما يعيدش تشغيل الـ effects.
  const dirtyCb = useRef(onDirtyChange);
  dirtyCb.current = onDirtyChange;
  useEffect(() => {
    dirtyCb.current?.(dirty);
  }, [dirty]);
  useEffect(() => () => dirtyCb.current?.(false), []);

  const patterns = showAll ? null : tab?.visible || null;

  function switchMode(next) {
    if (next === mode) return;
    if (next === "json") {
      setJsonText(JSON.stringify(draft, null, 2));
      setJsonError("");
      setMode("json");
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("لازم يكون object");
      setDraft(parsed);
      setJsonError("");
      setMode("form");
    } catch (e) {
      setJsonError(`JSON غير صالح: ${e.message}`);
    }
  }

  function loadPageDefaults() {
    const defaults = PAGE_DEFAULTS[tab.pageKey];
    if (!defaults) return;
    setDraft((prev) => {
      const next = clone(prev) || {};
      next.i18n = next.i18n || {};
      for (const lang of LANGS) {
        next.i18n[lang] = next.i18n[lang] || {};
        next.i18n[lang].page = fillMissing(next.i18n[lang].page, defaults[lang]);
      }
      return next;
    });
    setNotice({ type: "ok", text: "اتحمّلت نصوص الصفحة (حقل page) — عدّلها واضغط حفظ." });
  }

  async function save() {
    let payload = draft;
    if (mode === "json") {
      try {
        payload = JSON.parse(jsonText);
      } catch (e) {
        return setJsonError(`JSON غير صالح: ${e.message}`);
      }
    }
    if (tab?.markManaged) payload = { ...payload, linksManaged: true };

    setSaving(true);
    setNotice(null);
    try {
      const qs = new URLSearchParams({ collection, id: String(meta._id) });
      if (meta.updatedAt) qs.set("ifUpdatedAt", meta.updatedAt);
      const saved = await api(`/api/admin/content?${qs}`, { method: "PUT", body: JSON.stringify(payload) });
      setNotice({ type: "ok", text: "اتحفظ بنجاح — التعديل ظاهر على الموقع دلوقتي." });
      onSaved?.(saved);
    } catch (err) {
      setNotice(
        err.status === 409
          ? { type: "conflict", text: err.message }
          : { type: "error", text: `فشل الحفظ: ${err.message}` }
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("حذف الـ document ده نهائيًا من الداتابيز؟ مفيش تراجع.")) return;
    setSaving(true);
    try {
      await api(`/api/admin/content?collection=${encodeURIComponent(collection)}&id=${encodeURIComponent(meta._id)}`, { method: "DELETE" });
      onDeleted?.(meta._id);
    } catch (err) {
      setNotice({ type: "error", text: `فشل الحذف: ${err.message}` });
      setSaving(false);
    }
  }

  const btn = "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-40";

  return (
    <div className="space-y-4">
      {/* شريط الأدوات */}
      <div className="sticky top-4 z-20 -mx-1 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        <button type="button" onClick={save} disabled={saving || (!dirty && mode === "form")} className={`${btn} bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90`}>
          <Save size={15} /> {saving ? "جاري الحفظ..." : "حفظ"}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(clone(body));
            setJsonError("");
            setMode("form");
            setNotice(null);
          }}
          disabled={saving || !dirty}
          className={`${btn} border border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600`}
        >
          <RotateCcw size={15} /> تجاهل التعديلات
        </button>

        <div className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />

        <button type="button" onClick={() => switchMode("form")} className={`${btn} ${mode === "form" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
          <FileText size={15} /> نموذج
        </button>
        <button type="button" onClick={() => switchMode("json")} className={`${btn} ${mode === "json" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
          <Braces size={15} /> JSON
        </button>

        {mode === "form" && tab?.visible && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className={`${btn} text-gray-600 hover:bg-gray-100`}>
            {showAll ? <EyeOff size={15} /> : <Eye size={15} />} {showAll ? "عرض حقول التاب فقط" : "عرض كل الحقول"}
          </button>
        )}
        {mode === "form" && tab?.pageKey && (
          <button type="button" onClick={loadPageDefaults} className={`${btn} text-blue-600 hover:bg-blue-50`} title="يضيف حقل page بنصوص الصفحة الافتراضية عشان تعدّلها">
            <Wand2 size={15} /> تحميل نصوص الصفحة
          </button>
        )}

        {allowDelete && (
          <button type="button" onClick={remove} disabled={saving} className={`${btn} ms-auto border border-red-200 text-red-600 hover:bg-red-50`}>
            <Trash2 size={15} /> حذف
          </button>
        )}

        {dirty && <span className="w-full text-xs font-medium text-amber-700 sm:w-auto sm:ms-auto">● فيه تعديلات غير محفوظة</span>}
      </div>

      {notice && (
        <div
          role="status"
          className={`rounded-xl px-4 py-3 text-sm ${
            notice.type === "ok" ? "bg-green-50 text-green-800" : notice.type === "conflict" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
          {notice.type === "conflict" && (
            <span className="ms-2">
              (حدّث الصفحة عشان تجيب آخر نسخة — تعديلاتك الحالية هتضيع، فانسخها الأول لو محتاجها.)
            </span>
          )}
        </div>
      )}

      {mode === "form" && tab?.items && <ItemsManager config={tab.items} draft={draft} setDraft={setDraft} />}

      {mode === "form" ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <TreeEditor value={draft} onChange={setDraft} patterns={patterns} />
        </div>
      ) : (
        <div>
          <textarea
            dir="ltr"
            spellCheck={false}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError("");
            }}
            className="h-[60vh] w-full rounded-2xl border border-gray-300 bg-white p-4 font-mono text-xs leading-relaxed outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          {jsonError && <p className="mt-2 text-sm text-red-600">{jsonError}</p>}
        </div>
      )}

      {meta.updatedAt && (
        <p className="text-xs text-gray-400">
          آخر تعديل: {new Date(meta.updatedAt).toLocaleString("ar-EG")} · id: <code dir="ltr">{String(meta._id)}</code>
        </p>
      )}
    </div>
  );
}
