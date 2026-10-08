"use client";

// app/admin/ItemsManager.jsx
//
// مدير عناصر للقوائم اللي كل عنصر فيها ليه ترجمة في كل لغة (الخدمات، الوظائف،
// روابط الناف بار والفوتر). إضافة/حذف/ترتيب/إعادة تسمية بيتعمل في القائمة
// وفي i18n.<lang>.<langPath> مع بعض، فالـ document ما يطلعش مكسور (عنصر
// من غير ترجمة أو ترجمة يتيمة).

import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, Check, X } from "lucide-react";
import { clone } from "./adminUtils";
import { LANGS } from "./tabsConfig";

const ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

const LANG_LABEL = { en: "EN", ar: "AR" };

function langsOf(draft) {
  return Array.from(new Set([...LANGS, ...Object.keys(draft?.i18n || {})]));
}

export default function ItemsManager({ config, draft, setDraft }) {
  const { listKey, idKey, langPath, template, extra = {}, titleOf, idLabel } = config;
  const list = Array.isArray(draft?.[listKey]) ? draft[listKey] : [];
  const langs = langsOf(draft);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ id: "", extras: { ...extra }, titles: {} });
  const [error, setError] = useState("");
  const [renaming, setRenaming] = useState(null); // { index, value }

  const titleFor = (item, lang) => titleOf(draft?.i18n?.[lang]?.[langPath]?.[item[idKey]]);

  function update(fn) {
    setDraft((prev) => {
      const next = clone(prev) || {};
      fn(next);
      return next;
    });
  }

  function resetForm() {
    setForm({ id: "", extras: { ...extra }, titles: {} });
    setError("");
    setAdding(false);
  }

  function add() {
    const id = form.id.trim();
    if (!ID_REGEX.test(id)) return setError("الـ id لازم يكون حروف إنجليزي/أرقام/شرطة فقط");
    if (list.some((it) => it[idKey] === id)) return setError("الـ id ده موجود بالفعل");

    update((next) => {
      next[listKey] = [...(next[listKey] || []), { [idKey]: id, ...form.extras }];
      next.i18n = next.i18n || {};
      for (const lang of langs) {
        next.i18n[lang] = next.i18n[lang] || {};
        next.i18n[lang][langPath] = next.i18n[lang][langPath] || {};
        const title = form.titles[lang] || "";
        next.i18n[lang][langPath][id] =
          typeof template === "string" ? title : { ...clone(template), title };
      }
    });
    resetForm();
  }

  function remove(index) {
    const item = list[index];
    if (!window.confirm(`حذف "${item[idKey]}" نهائيًا من القائمة ومن كل اللغات؟`)) return;
    update((next) => {
      next[listKey] = next[listKey].filter((_, i) => i !== index);
      for (const lang of langs) delete next.i18n?.[lang]?.[langPath]?.[item[idKey]];
    });
  }

  function move(index, dir) {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    update((next) => {
      const arr = next[listKey];
      [arr[index], arr[j]] = [arr[j], arr[index]];
    });
  }

  function commitRename() {
    const { index, value } = renaming;
    const oldId = list[index][idKey];
    const newId = value.trim();
    if (newId === oldId) return setRenaming(null);
    if (!ID_REGEX.test(newId)) return setError("الـ id لازم يكون حروف إنجليزي/أرقام/شرطة فقط");
    if (list.some((it) => it[idKey] === newId)) return setError("الـ id ده موجود بالفعل");
    update((next) => {
      next[listKey][index][idKey] = newId;
      for (const lang of langs) {
        const map = next.i18n?.[lang]?.[langPath];
        if (map && oldId in map) {
          map[newId] = map[oldId];
          delete map[oldId];
        }
      }
    });
    setError("");
    setRenaming(null);
  }

  function setExtra(index, key, value) {
    update((next) => {
      next[listKey][index][key] = value;
    });
  }

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-blue-900">
          العناصر <span className="text-sm font-normal text-gray-400">({list.length})</span>
        </h3>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={14} /> إضافة عنصر جديد
          </button>
        )}
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {adding && (
        <div className="mb-4 space-y-3 rounded-xl border border-gray-200 bg-white p-3">
          <label className="block text-xs font-medium text-gray-600">
            {idLabel}
            <input
              dir="ltr"
              autoFocus
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              className={`${inputClass} mt-1`}
            />
          </label>
          {Object.keys(extra).map((key) => (
            <label key={key} className="block text-xs font-medium text-gray-600">
              {key}
              <input
                dir="ltr"
                value={form.extras[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, extras: { ...f.extras, [key]: e.target.value } }))}
                className={`${inputClass} mt-1`}
              />
            </label>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            {langs.map((lang) => (
              <label key={lang} className="block text-xs font-medium text-gray-600">
                العنوان / الاسم ({LANG_LABEL[lang] || lang})
                <input
                  dir="auto"
                  value={form.titles[lang] || ""}
                  onChange={(e) => setForm((f) => ({ ...f, titles: { ...f.titles, [lang]: e.target.value } }))}
                  className={`${inputClass} mt-1`}
                />
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={add} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-600/90">
              إضافة
            </button>
            <button type="button" onClick={resetForm} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
              إلغاء
            </button>
          </div>
          <p className="text-xs text-gray-400">باقي تفاصيل العنصر (الوصف، النقاط...) تقدر تكملها من الحقول تحت بعد الإضافة.</p>
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-gray-400">مفيش عناصر لسه.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((item, index) => (
            <li key={`${item[idKey]}-${index}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <div className="min-w-0 flex-1">
                {renaming?.index === index ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      dir="ltr"
                      autoFocus
                      value={renaming.value}
                      onChange={(e) => setRenaming({ index, value: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && commitRename()}
                      className={`${inputClass} !py-1`}
                    />
                    <button type="button" title="حفظ الاسم" onClick={commitRename} className="text-green-700">
                      <Check size={16} />
                    </button>
                    <button type="button" title="إلغاء" onClick={() => setRenaming(null)} className="text-gray-400">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="truncate text-sm font-semibold text-blue-900">
                      {titleFor(item, "ar") || titleFor(item, "en") || item[idKey]}
                    </p>
                    <p dir="ltr" className="truncate text-start text-xs text-gray-400">
                      {item[idKey]}
                      {titleFor(item, "en") ? ` · ${titleFor(item, "en")}` : ""}
                    </p>
                  </>
                )}
              </div>

              {Object.keys(extra).map((key) => (
                <input
                  key={key}
                  dir="ltr"
                  aria-label={key}
                  title={key}
                  value={item[key] ?? ""}
                  onChange={(e) => setExtra(index, key, e.target.value)}
                  className={`${inputClass} !w-40 !py-1`}
                />
              ))}

              <div className="flex gap-1">
                <button type="button" title="إعادة تسمية الـ id" onClick={() => setRenaming({ index, value: item[idKey] })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600">
                  <Pencil size={14} />
                </button>
                <button type="button" title="أعلى" disabled={index === 0} onClick={() => move(index, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-30">
                  <ArrowUp size={14} />
                </button>
                <button type="button" title="أسفل" disabled={index === list.length - 1} onClick={() => move(index, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-30">
                  <ArrowDown size={14} />
                </button>
                <button type="button" title="حذف" onClick={() => remove(index)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
