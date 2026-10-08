"use client";

// app/admin/CollectionManager.jsx
//
// بيحمّل documents كولكشن من /api/admin/content ويعرضها:
//   - singleton: document واحد (محتوى صفحة) → محرر مباشرة.
//   - list: عدة documents (رسائل الزوار، أو أي كولكشن في تاب "كولكشنز أخرى")
//     → قائمة قابلة للفتح، مع إضافة وحذف.

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import DocEditor from "./DocEditor";
import { api, splitMeta } from "./adminUtils";

const SKELETON = { i18n: { en: {}, ar: {} } };

function summarize(doc, keys) {
  const { body } = splitMeta(doc);
  const pick = (keys?.length ? keys : Object.keys(body))
    .map((k) => body[k])
    .filter((v) => typeof v === "string" && v.trim());
  return pick.slice(0, 3).join(" · ").slice(0, 110) || String(doc._id);
}

export default function CollectionManager({ tab, collection, mode, onDirtyChange }) {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [dirtyMap, setDirtyMap] = useState({});

  const load = useCallback(async () => {
    setDocs(null);
    setError("");
    try {
      const data = await api(`/api/admin/content?collection=${encodeURIComponent(collection)}`);
      let list = data.docs || [];
      if (tab?.newestFirst) list = [...list].reverse();
      setDocs(list);
    } catch (err) {
      setError(err.message);
    }
  }, [collection, tab?.newestFirst]);

  useEffect(() => {
    load();
  }, [load]);

  // الأب محتاج يعرف لو أي document هنا فيه تعديلات غير محفوظة.
  const dirtyCb = useRef(onDirtyChange);
  dirtyCb.current = onDirtyChange;
  useEffect(() => {
    dirtyCb.current?.(Object.values(dirtyMap).some(Boolean));
  }, [dirtyMap]);
  useEffect(() => () => dirtyCb.current?.(false), []);

  const markDirty = (id) => (isDirty) =>
    setDirtyMap((m) => (m[id] === isDirty ? m : { ...m, [id]: isDirty }));

  async function create(initial) {
    setBusy(true);
    setError("");
    try {
      const created = await api(`/api/admin/content?collection=${encodeURIComponent(collection)}`, {
        method: "POST",
        body: JSON.stringify(initial),
      });
      setDocs((prev) => (tab?.newestFirst ? [created, ...(prev || [])] : [...(prev || []), created]));
      setOpenId(String(created._id));
    } catch (err) {
      setError(`فشل الإنشاء: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  const replaceDoc = (saved) =>
    setDocs((prev) => prev.map((d) => (String(d._id) === String(saved._id) ? saved : d)));
  const removeDoc = (id) => {
    setDocs((prev) => prev.filter((d) => String(d._id) !== String(id)));
    setDirtyMap((m) => ({ ...m, [id]: false }));
  };

  if (error && !docs) {
    return (
      <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">
        تعذّر تحميل البيانات: {error}{" "}
        <button type="button" onClick={load} className="font-semibold underline">
          إعادة المحاولة
        </button>
      </div>
    );
  }
  if (!docs) return <p className="py-10 text-center text-sm text-charcoal/50">جاري التحميل...</p>;

  // ── singleton ──
  if (mode === "singleton") {
    if (docs.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-charcoal/20 bg-white p-8 text-center">
          <p className="text-sm text-charcoal/70">
            مفيش document للكولكشن <code dir="ltr">{collection}</code> لسه، فالموقع بيستخدم النصوص الافتراضية اللي في الكود.
          </p>
          <p className="mt-1 text-xs text-charcoal/50">
            الأفضل تشغّل <code dir="ltr">node scripts/seed.mjs</code> مرة عشان تتحمّل المحتوى الحالي كامل، أو أنشئ document فاضي هنا وابدأ تكتب.
          </p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={() => create(SKELETON)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold/90 disabled:opacity-40"
          >
            <Plus size={15} /> إنشاء document فاضي
          </button>
        </div>
      );
    }

    const doc = docs[0];
    return (
      <div className="space-y-4">
        {docs.length > 1 && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            تنبيه: الكولكشن فيه {docs.length} documents، والموقع بيقرا الأول بس. بتعدّل الأول هنا — الباقي تقدر تمسحه من تاب «كولكشنز أخرى».
          </p>
        )}
        <DocEditor
          key={String(doc._id)}
          collection={collection}
          doc={doc}
          tab={tab}
          onSaved={replaceDoc}
          onDirtyChange={markDirty(String(doc._id))}
        />
      </div>
    );
  }

  // ── list ──
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-charcoal/60">{docs.length} عنصر</p>
        <button type="button" onClick={load} className="flex items-center gap-1 text-sm text-sky hover:underline">
          <RefreshCw size={13} /> تحديث
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => create({})}
          className="ms-auto flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-semibold text-offwhite hover:bg-navy/90 disabled:opacity-40"
        >
          <Plus size={14} /> إضافة document
        </button>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {docs.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm text-charcoal/50">الكولكشن فاضي.</p>}

      {docs.map((doc) => {
        const id = String(doc._id);
        const isOpen = openId === id;
        return (
          <div key={id} className="rounded-2xl border border-charcoal/10 bg-white">
            <button type="button" onClick={() => setOpenId(isOpen ? null : id)} className="flex w-full items-center gap-2 px-4 py-3 text-start">
              {isOpen ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0 rtl:rotate-180" />}
              <span dir="auto" className="flex-1 truncate text-sm font-medium text-navy">
                {summarize(doc, tab?.summaryKeys)}
              </span>
              {dirtyMap[id] && <span className="text-xs text-amber-700">● غير محفوظ</span>}
              {doc.createdAt && <span className="hidden text-xs text-charcoal/40 sm:block">{new Date(doc.createdAt).toLocaleDateString("ar-EG")}</span>}
            </button>
            {isOpen && (
              <div className="border-t border-charcoal/10 p-4">
                <DocEditor
                  collection={collection}
                  doc={doc}
                  tab={null}
                  allowDelete
                  onSaved={replaceDoc}
                  onDeleted={removeDoc}
                  onDirtyChange={markDirty(id)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
