"use client";

// app/admin/TreeEditor.jsx
//
// محرر الحقول بنفس شكل تابات Edumaster الداخلية: أقسام قابلة للطي (كارت
// رمادي/أبيض بحدود سميكة)، جواها كروت العناصر (حد بنفسجي فاتح)، وحقول
// بـ label فوق الـ input، ومعاينة للصور، وزر "Add" / "Remove" بسيطين للقوائم.
// بيشتغل على أي JSON، فمفيش حاجة في الـ document برّه نطاق الأدمن.

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { clone, humanize, isPlainObject } from "./adminUtils";
import { isPathVisible } from "./tabsConfig";

// بيبني عنصر جديد للقائمة بنفس شكل آخر عنصر (مفاتيح فاضية).
function blankLike(sample) {
  if (typeof sample === "string") return "";
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  if (Array.isArray(sample)) return [];
  if (isPlainObject(sample)) {
    const out = {};
    for (const [k, v] of Object.entries(sample)) out[k] = blankLike(v);
    return out;
  }
  return "";
}

const IMAGE_KEY = /(image|img|logo|avatar|favicon|background|photo|banner)/i;
const COLOR_KEY = /color/i;

const looksLikeUrl = (v) => typeof v === "string" && /^(https?:\/\/|\/)/.test(v.trim());

function inputClass(deep) {
  return deep
    ? "w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-500"
    : "w-full px-4 py-2 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500";
}

function labelClass(deep) {
  return deep
    ? "block text-xs font-semibold text-gray-500 mb-1"
    : "block text-sm font-semibold mb-2";
}

function Preview({ src, deep }) {
  if (!looksLikeUrl(src)) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Preview"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
      className={`w-full ${deep ? "h-32" : "h-40"} object-cover rounded-lg border-2 border-gray-200`}
    />
  );
}

function Field({ name, value, onChange, deep }) {
  const label = <label className={`${labelClass(deep)} capitalize`}>{humanize(name)}</label>;

  if (typeof value === "boolean") {
    return (
      <div>
        {label}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-blue-600" />
          {value ? "Yes" : "No"}
        </label>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div>
        {label}
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className={inputClass(deep)}
        />
      </div>
    );
  }

  const text = value === null || value === undefined ? "" : String(value);

  if (COLOR_KEY.test(name) && /^#[0-9a-f]{6}$/i.test(text)) {
    return (
      <div>
        {label}
        <div className="flex items-center gap-2">
          <input type="color" value={text} onChange={(e) => onChange(e.target.value)} className="h-10 w-10 border-0 p-1 rounded-lg cursor-pointer" />
          <span className="text-sm text-gray-500">{text}</span>
        </div>
      </div>
    );
  }

  if (IMAGE_KEY.test(name)) {
    return (
      <div className="md:col-span-2">
        {label}
        <div className="flex flex-col gap-3">
          <input dir="ltr" type="text" value={text} onChange={(e) => onChange(e.target.value)} className={inputClass(deep)} placeholder="https://..." />
          <Preview src={text} deep={deep} />
        </div>
      </div>
    );
  }

  const long = text.length > 70 || text.includes("\n");
  if (long) {
    return (
      <div className="md:col-span-2">
        {label}
        <textarea dir="auto" value={text} onChange={(e) => onChange(e.target.value)} className={`${inputClass(deep)} min-h-24`} rows={Math.min(10, Math.max(3, Math.ceil(text.length / 70)))} />
      </div>
    );
  }
  return (
    <div>
      {label}
      <input dir="auto" type="text" value={text} onChange={(e) => onChange(e.target.value)} className={inputClass(deep)} />
    </div>
  );
}

// قسم قابل للطي: depth 0 = قسم رئيسي (Edumaster section card)، أعمق = كارت عنصر.
function Section({ title, count, defaultOpen, depth, actions, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const isSection = depth === 0;
  return (
    <div
      className={
        isSection
          ? "md:col-span-2 bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-2 border-gray-200"
          : "md:col-span-2 p-4 bg-white border-2 border-purple-100 rounded-xl"
      }
    >
      <div className="flex justify-between items-center gap-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center justify-between text-left">
          <h3 className={`${isSection ? "text-xl text-gray-800" : "text-base text-gray-700"} font-semibold flex items-center gap-2 capitalize`}>
            {title}
            {count !== undefined && <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{count}</span>}
          </h3>
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {actions}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

function titleOfItem(item, i) {
  if (isPlainObject(item)) {
    const t = item.title ?? item.label ?? item.name;
    if (typeof t === "string" && t.trim()) return `#${i + 1} — ${t.slice(0, 40)}`;
  }
  return `#${i + 1}`;
}

export default function TreeEditor({ value, onChange, path = [], patterns = null, depth = 0 }) {
  const deep = depth >= 2;

  // ── object ──
  if (isPlainObject(value)) {
    const keys = Object.keys(value).filter((k) => isPathVisible(patterns, [...path, k]));
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {keys.map((key) => {
          const child = value[key];
          const set = (v) => onChange({ ...value, [key]: v });
          if (child !== null && typeof child === "object") {
            const count = Array.isArray(child) ? child.length : undefined;
            return (
              <Section
                key={key}
                title={humanize(key)}
                count={count}
                depth={depth}
                defaultOpen={depth < 1 || (depth === 1 && path[path.length - 1] === "i18n")}
              >
                <TreeEditor value={child} onChange={set} path={[...path, key]} patterns={patterns} depth={depth + 1} />
              </Section>
            );
          }
          return <Field key={key} name={key} value={child} onChange={set} deep={deep} />;
        })}
      </div>
    );
  }

  // ── array ──
  if (Array.isArray(value)) {
    const move = (i, dir) => {
      const j = i + dir;
      if (j < 0 || j >= value.length) return;
      const next = [...value];
      [next[i], next[j]] = [next[j], next[i]];
      onChange(next);
    };
    const setAt = (i, v) => onChange(value.map((x, idx) => (idx === i ? v : x)));
    const controls = (i) => (
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" title="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30">
          <ArrowUp size={16} />
        </button>
        <button type="button" title="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30">
          <ArrowDown size={16} />
        </button>
        <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm ms-1">
          <Trash2 size={16} /> Remove
        </button>
      </div>
    );

    return (
      <div className="space-y-4">
        {value.map((item, i) =>
          item !== null && typeof item === "object" ? (
            <Section key={i} title={titleOfItem(item, i)} depth={Math.max(depth, 1)} defaultOpen={false} actions={controls(i)}>
              <TreeEditor value={item} onChange={(v) => setAt(i, v)} path={[...path, i]} patterns={patterns} depth={depth + 1} />
            </Section>
          ) : (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <Field name={`#${i + 1}`} value={item} onChange={(v) => setAt(i, v)} deep />
              </div>
              {controls(i)}
            </div>
          )
        )}
        <button
          type="button"
          onClick={() => onChange([...value, value.length ? blankLike(clone(value[value.length - 1])) : ""])}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>
    );
  }

  return <Field name="value" value={value} onChange={onChange} deep={deep} />;
}
