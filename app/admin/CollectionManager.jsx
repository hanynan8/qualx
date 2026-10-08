"use client";

// app/admin/CollectionManager.jsx
//
// بيحمّل document الصفحة (singleton) من /api/admin/content ويعرضه في DocEditor.
// بيوصّل أزرار هيدر البانل (Refresh / Save All) عن طريق onControls.

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader, Plus } from "lucide-react";
import DocEditor from "./DocEditor";
import { api } from "./adminUtils";

const SKELETON = { i18n: { en: {}, ar: {} } };

export default function CollectionManager({ tab, collection, onDirtyChange, onControls }) {
  const [doc, setDoc] = useState(undefined); // undefined = بيحمّل، null = مفيش document
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editorControls, setEditorControls] = useState(null);

  const load = useCallback(async () => {
    setDoc(undefined);
    setError("");
    try {
      const data = await api(`/api/admin/content?collection=${encodeURIComponent(collection)}`);
      setDoc((data.docs || [])[0] ?? null);
    } catch (err) {
      setError(err.message);
      setDoc(null);
    }
  }, [collection]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDirty = useCallback(
    (v) => {
      setDirty(v);
      onDirtyChange?.(v);
    },
    [onDirtyChange]
  );
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const registerControls = useCallback((c) => setEditorControls(c), []);

  // Refresh بيرمي أي تعديل غير محفوظ — بنسأل الأول (زي تحذير التنقل بين التابات).
  const refresh = useCallback(() => {
    if (dirty && !window.confirm("فيه تعديلات غير محفوظة هتضيع لو حدّثت. تكمّل؟")) return;
    load();
  }, [dirty, load]);

  // الهيدر بيستقبل الدوال دي من الأب (PagePanel).
  useEffect(() => {
    onControls?.({
      refresh,
      loading: doc === undefined,
      save: editorControls?.save,
      saving: !!editorControls?.saving,
      canSave: !!editorControls,
    });
  }, [onControls, refresh, doc, editorControls]);
  useEffect(() => () => onControls?.(null), [onControls]);

  async function createEmpty() {
    setBusy(true);
    setError("");
    try {
      const created = await api(`/api/admin/content?collection=${encodeURIComponent(collection)}`, {
        method: "POST",
        body: JSON.stringify(SKELETON),
      });
      setDoc(created);
    } catch (err) {
      setError(`فشل الإنشاء: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  if (doc === undefined) {
    return (
      <div className="p-12 text-center">
        <Loader className="animate-spin mx-auto" size={48} />
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center">
        {error ? (
          <p className="text-sm text-red-600">تعذّر تحميل البيانات: {error}</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              مفيش document للكولكشن <code dir="ltr">{collection}</code> لسه، فالموقع بيستخدم النصوص الافتراضية اللي في الكود.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              الأفضل تشغّل <code dir="ltr">node scripts/seed.mjs</code> مرة عشان تتحمّل المحتوى الحالي كامل، أو أنشئ document فاضي وابدأ تكتب.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={createEmpty}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={18} /> إنشاء document فاضي
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <DocEditor
      key={String(doc._id)}
      collection={collection}
      doc={doc}
      tab={tab}
      onSaved={setDoc}
      onDirtyChange={handleDirty}
      registerControls={registerControls}
    />
  );
}
