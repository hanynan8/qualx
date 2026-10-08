"use client";

// app/admin/DocEditor.jsx
//
// محرر document واحد (محتوى صفحة) بنفس تجربة تابات Edumaster: الحفظ بزر "Save All"
// في هيدر البانل (بيوصله عن طريق registerControls)، ورسالة نجاح/خطأ بشريط
// ملوّن فوق المحتوى بيختفي لوحده، والحقول في أقسام قابلة للطي (TreeEditor).
// فضل شغّال تحت الغطا: كشف التعارض (409) لو الـ document اتعدّل من مكان تاني،
// وتحذير التعديلات غير المحفوظة.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, AlertCircle, Wand2 } from "lucide-react";
import TreeEditor from "./TreeEditor";
import ItemsManager from "./ItemsManager";
import { api, clone, fillMissing, splitMeta } from "./adminUtils";
import { LANGS } from "./tabsConfig";
import { PAGE_DEFAULTS } from "./pageDefaults";

const stable = (v) => JSON.stringify(v);

export default function DocEditor({ collection, doc, tab, onSaved, onDirtyChange, registerControls }) {
  const { meta, body } = useMemo(() => splitMeta(doc), [doc]);
  const [draft, setDraft] = useState(() => clone(body));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "ok" | "error" | "conflict", text }

  // لما الـ document الأصلي يتغير (بعد حفظ/إعادة تحميل) نصفّر المسودة عليه.
  const docVersion = `${meta._id}:${meta.updatedAt}`;
  useEffect(() => {
    setDraft(clone(body));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docVersion]);

  const dirty = stable(draft) !== stable(body);
  // الـ callbacks بتتحفظ في refs عشان تغيّر هويتها مع كل render عند الأب ما يعيدش تشغيل الـ effects.
  const dirtyCb = useRef(onDirtyChange);
  dirtyCb.current = onDirtyChange;
  const savedCb = useRef(onSaved);
  savedCb.current = onSaved;
  useEffect(() => {
    dirtyCb.current?.(dirty);
  }, [dirty]);
  useEffect(() => () => dirtyCb.current?.(false), []);

  // رسائل النجاح/الخطأ بتختفي بعد 4 ثواني (نفس Edumaster)، وتنبيه التعارض بيفضل.
  useEffect(() => {
    if (!notice || notice.type === "conflict") return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const save = useCallback(async () => {
    const payload = tab?.markManaged ? { ...draft, linksManaged: true } : draft;
    setSaving(true);
    setNotice(null);
    try {
      const qs = new URLSearchParams({ collection, id: String(meta._id) });
      if (meta.updatedAt) qs.set("ifUpdatedAt", meta.updatedAt);
      const saved = await api(`/api/admin/content?${qs}`, { method: "PUT", body: JSON.stringify(payload) });
      setNotice({ type: "ok", text: "✓ تم حفظ الإعدادات بنجاح" });
      savedCb.current?.(saved);
    } catch (err) {
      setNotice(
        err.status === 409
          ? { type: "conflict", text: `${err.message} — حدّث الصفحة عشان تجيب آخر نسخة (تعديلاتك الحالية هتضيع، فانسخها الأول لو محتاجها).` }
          : { type: "error", text: `خطأ في الحفظ: ${err.message}` }
      );
    } finally {
      setSaving(false);
    }
  }, [collection, draft, meta._id, meta.updatedAt, tab?.markManaged]);

  // هيدر البانل (Refresh / Save All) بيستخدم الدوال دي.
  useEffect(() => {
    registerControls?.({ save, saving, dirty });
  }, [registerControls, save, saving, dirty]);
  useEffect(() => () => registerControls?.(null), [registerControls]);

  // لو الصفحة ليها نصوص افتراضية (pageKey) والـ document لسه ما فيهوش حقل page،
  // بنعرض زرار واحد يضيفها عشان تتعدّل من هنا (بيختفي لما تتحمّل).
  const defaults = tab?.pageKey ? PAGE_DEFAULTS[tab.pageKey] : null;
  const missingPageTexts = !!defaults && LANGS.some((lang) => !draft?.i18n?.[lang]?.page);

  function loadPageDefaults() {
    setDraft((prev) => {
      const next = clone(prev) || {};
      next.i18n = next.i18n || {};
      for (const lang of LANGS) {
        next.i18n[lang] = next.i18n[lang] || {};
        next.i18n[lang].page = fillMissing(next.i18n[lang].page, defaults[lang]);
      }
      return next;
    });
    setNotice({ type: "ok", text: "اتحمّلت نصوص الصفحة — عدّلها واضغط Save All." });
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div
          role="status"
          className={`px-6 py-4 rounded-xl flex items-center gap-3 ${
            notice.type === "ok" ? "bg-green-500 text-white" : notice.type === "conflict" ? "bg-amber-50 border-2 border-amber-200 text-amber-800" : "bg-red-500 text-white"
          }`}
        >
          {notice.type === "ok" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <span className="font-medium">{notice.text}</span>
        </div>
      )}

      {missingPageTexts && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border-2 border-blue-100 text-sm text-blue-900">
          <span>نصوص الصفحة الافتراضية لسه مش محمّلة في الداتابيز.</span>
          <button type="button" onClick={loadPageDefaults} className="flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800">
            <Wand2 size={15} /> تحميل نصوص الصفحة
          </button>
        </div>
      )}

      {tab?.items && <ItemsManager config={tab.items} draft={draft} setDraft={setDraft} />}

      <TreeEditor value={draft} onChange={setDraft} patterns={tab?.visible || null} />
    </div>
  );
}
