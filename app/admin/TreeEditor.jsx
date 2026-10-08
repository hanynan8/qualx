"use client";

// app/admin/TreeEditor.jsx
//
// محرر عام لأي JSON: نصوص، أرقام، true/false، قوائم، وobjects متداخلة —
// إضافة/حذف/تعديل لأي حاجة. بيشتغل على أي كولكشن مهما كان شكل الـ document،
// فمفيش حاجة في الداتابيز برّه نطاق الأدمن.

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { clone, humanize, isPlainObject } from "./adminUtils";
import { isPathVisible } from "./tabsConfig";

const NEW_FIELD_TYPES = [
  { id: "text", label: "نص" },
  { id: "longtext", label: "نص طويل" },
  { id: "number", label: "رقم" },
  { id: "boolean", label: "نعم/لا" },
  { id: "list", label: "قائمة" },
  { id: "object", label: "مجموعة حقول" },
];

function blankFor(type) {
  switch (type) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "list":
      return [];
    case "object":
      return {};
    default:
      return "";
  }
}

// بيبني عنصر جديد للقائمة بنفس شكل آخر عنصر (مفاتيح فاضية) عشان الأدمن ما يبدأش من الصفر.
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

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

function IconBtn({ title, onClick, children, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:opacity-30 ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600"
      }`}
    >
      {children}
    </button>
  );
}

function Leaf({ value, onChange }) {
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-blue-600" />
        {value ? "نعم" : "لا"}
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className={inputClass}
      />
    );
  }
  if (value === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>(فاضي)</span>
        <button type="button" className="text-blue-600 underline" onClick={() => onChange("")}>
          اكتب نص
        </button>
      </div>
    );
  }
  const text = String(value ?? "");
  const long = text.length > 70 || text.includes("\n");
  return long ? (
    <textarea
      dir="auto"
      rows={Math.min(10, Math.max(3, Math.ceil(text.length / 70) + text.split("\n").length - 1))}
      value={text}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} leading-relaxed`}
    />
  ) : (
    <input dir="auto" type="text" value={text} onChange={(e) => onChange(e.target.value)} className={inputClass} />
  );
}

function AddField({ onAdd, existing }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [err, setErr] = useState("");

  function submit() {
    const key = name.trim();
    if (!key) return setErr("اكتب اسم الحقل");
    if (/^\$|\.|^__proto__$|^constructor$|^prototype$/.test(key)) return setErr("اسم الحقل غير مسموح (بدون نقطة أو $ في الأول)");
    if (existing.includes(key)) return setErr("الحقل موجود بالفعل");
    onAdd(key, blankFor(type));
    setName("");
    setType("text");
    setErr("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
        <Plus size={14} /> إضافة حقل
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-blue-50 p-2">
      <input
        dir="ltr"
        autoFocus
        placeholder="اسم الحقل (إنجليزي)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className={`${inputClass} !w-48`}
      />
      <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputClass} !w-36`}>
        {NEW_FIELD_TYPES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
      <button type="button" onClick={submit} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        إضافة
      </button>
      <button type="button" onClick={() => setOpen(false)} className="px-2 text-sm text-gray-600 hover:text-gray-900">
        إلغاء
      </button>
      {err && <span className="w-full text-xs text-red-600">{err}</span>}
    </div>
  );
}

function Collapsible({ title, subtitle, defaultOpen, actions, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center gap-2 text-start">
          {open ? <ChevronDown size={16} className="shrink-0 text-gray-400" /> : <ChevronRight size={16} className="shrink-0 text-gray-400 rtl:rotate-180" />}
          <span className="text-sm font-semibold text-blue-900">{title}</span>
          {subtitle && <span className="truncate text-xs text-gray-400">{subtitle}</span>}
        </button>
        {actions}
      </div>
      {open && <div className="space-y-3 border-t border-gray-200 p-3">{children}</div>}
    </div>
  );
}

function previewOf(value) {
  if (typeof value === "string") return value.slice(0, 50);
  if (Array.isArray(value)) return `${value.length} عنصر`;
  if (isPlainObject(value)) return `${Object.keys(value).length} حقل`;
  return "";
}

// ───────────────────────── main recursive node ─────────────────────────
export default function TreeEditor({ value, onChange, path = [], patterns = null, depth = 0, lockedKeys = [] }) {
  // ── object ──
  if (isPlainObject(value)) {
    const keys = Object.keys(value).filter((k) => isPathVisible(patterns, [...path, k]));
    const hiddenCount = Object.keys(value).length - keys.length;
    return (
      <div className="space-y-3">
        {keys.map((key) => {
          const child = value[key];
          const childPath = [...path, key];
          const isContainer = child !== null && typeof child === "object";
          const label = (
            <span className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-blue-900">{humanize(key)}</span>
              <code dir="ltr" className="text-[11px] text-gray-400">
                {key}
              </code>
            </span>
          );
          const remove = lockedKeys.includes(key) ? null : (
            <IconBtn title="حذف الحقل" danger onClick={() => onChange(Object.fromEntries(Object.entries(value).filter(([k]) => k !== key)))}>
              <Trash2 size={14} />
            </IconBtn>
          );
          const set = (v) => onChange({ ...value, [key]: v });

          if (isContainer) {
            return (
              <Collapsible
                key={key}
                title={label}
                subtitle={previewOf(child)}
                defaultOpen={depth < 1 || (depth === 1 && path[path.length - 1] === "i18n")}
                actions={remove}
              >
                <TreeEditor value={child} onChange={set} path={childPath} patterns={patterns} depth={depth + 1} />
              </Collapsible>
            );
          }
          return (
            <div key={key} className="grid gap-1.5 sm:grid-cols-[minmax(0,180px)_1fr_auto] sm:items-start sm:gap-3">
              <div className="pt-2">{label}</div>
              <Leaf value={child} onChange={set} />
              <div className="pt-0.5">{remove}</div>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <p className="text-xs text-gray-400">+ {hiddenCount} حقل مخفي في التاب ده (فعّل «عرض كل الحقول» لإظهارها)</p>
        )}
        <AddField existing={Object.keys(value)} onAdd={(k, v) => onChange({ ...value, [k]: v })} />
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
    return (
      <div className="space-y-3">
        {value.map((item, i) => {
          const itemPath = [...path, i];
          const controls = (
            <div className="flex gap-1">
              <IconBtn title="أعلى" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp size={14} />
              </IconBtn>
              <IconBtn title="أسفل" disabled={i === value.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown size={14} />
              </IconBtn>
              <IconBtn title="حذف العنصر" danger onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
                <Trash2 size={14} />
              </IconBtn>
            </div>
          );
          if (item !== null && typeof item === "object") {
            return (
              <Collapsible key={i} title={`#${i + 1}`} subtitle={previewOf(item.title ?? item.label ?? item.name ?? item)} defaultOpen={false} actions={controls}>
                <TreeEditor value={item} onChange={(v) => onChange(value.map((x, idx) => (idx === i ? v : x)))} path={itemPath} patterns={patterns} depth={depth + 1} />
              </Collapsible>
            );
          }
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="w-6 shrink-0 pt-2 text-center text-xs text-gray-400">{i + 1}</span>
              <div className="flex-1">
                <Leaf value={item} onChange={(v) => onChange(value.map((x, idx) => (idx === i ? v : x)))} />
              </div>
              {controls}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => onChange([...value, value.length ? blankLike(clone(value[value.length - 1])) : ""])}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <Plus size={14} /> إضافة عنصر
        </button>
      </div>
    );
  }

  // ── leaf at root (rare) ──
  return <Leaf value={value} onChange={onChange} />;
}
