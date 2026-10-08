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
const inputClass = "w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-500";

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
    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-2 border-gray-200">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
          Items
          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{list.length}</span>
        </h3>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {list.length === 0 ? (
        <p className="text-sm text-gray-400 mb-4">مفيش عناصر لسه.</p>
      ) : (
        <div className="space-y-4 mb-4">
          {list.map((item, index) => (
            <div key={`${item[idKey]}-${index}`} className="p-4 bg-white border-2 border-purple-100 rounded-xl flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                {renaming?.index === index ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      dir="ltr"
                      autoFocus
                      value={renaming.value}
                      onChange={(e) => setRenaming({ index, value: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && commitRename()}
                      className={inputClass}
                    />
                    <button type="button" title="حفظ الاسم" onClick={commitRename} className="text-green-700">
                      <Check size={18} />
                    </button>
                    <button type="button" title="إلغاء" onClick={() => setRenaming(null)} className="text-gray-400">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="truncate font-semibold text-gray-800">
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
                  className={`${inputClass} !w-40`}
                />
              ))}

              <div className="flex items-center gap-1">
                <button type="button" title="إعادة تسمية الـ id" onClick={() => setRenaming({ index, value: item[idKey] })} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
                  <Pencil size={16} />
                </button>
                <button type="button" title="Move up" disabled={index === 0} onClick={() => move(index, -1)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                  <ArrowUp size={16} />
                </button>
                <button type="button" title="Move down" disabled={index === list.length - 1} onClick={() => move(index, 1)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                  <ArrowDown size={16} />
                </button>
                <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm ms-1">
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="space-y-3 p-4 bg-white border-2 border-purple-100 rounded-xl">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{idLabel}</label>
            <input
              dir="ltr"
              autoFocus
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              className={inputClass}
            />
          </div>
          {Object.keys(extra).map((key) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{key}</label>
              <input
                dir="ltr"
                value={form.extras[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, extras: { ...f.extras, [key]: e.target.value } }))}
                className={inputClass}
              />
            </div>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            {langs.map((lang) => (
              <div key={lang}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">العنوان / الاسم ({LANG_LABEL[lang] || lang})</label>
                <input
                  dir="auto"
                  value={form.titles[lang] || ""}
                  onChange={(e) => setForm((f) => ({ ...f, titles: { ...f.titles, [lang]: e.target.value } }))}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={add} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-semibold">
              <Plus size={16} /> Add
            </button>
            <button type="button" onClick={resetForm} className="text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-400">باقي تفاصيل العنصر (الوصف، النقاط...) تقدر تكملها من الحقول تحت بعد الإضافة، وبعدين Save All.</p>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
          <Plus size={18} /> Add Item
        </button>
      )}
    </div>
  );
}
