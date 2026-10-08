// app/admin/adminUtils.js
//
// دوال صغيرة بتتعامل مع الـ JSON من غير ما تعدّل الأصل (immutable).

export const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function getIn(obj, path) {
  return path.reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function setIn(obj, path, value) {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const base = Array.isArray(obj) ? [...obj] : isPlainObject(obj) ? { ...obj } : {};
  base[head] = setIn(base[head], rest, value);
  return base;
}

export function deleteIn(obj, path) {
  if (path.length === 0) return obj;
  const [head, ...rest] = path;
  if (obj == null || typeof obj !== "object") return obj;
  if (rest.length === 0) {
    if (Array.isArray(obj)) return obj.filter((_, i) => i !== Number(head));
    const copy = { ...obj };
    delete copy[head];
    return copy;
  }
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[head] = deleteIn(copy[head], rest);
  return copy;
}

// يكمّل بس المفاتيح الناقصة في target من defaults (من غير ما يمسح/يغيّر اللي موجود).
export function fillMissing(target, defaults) {
  if (Array.isArray(defaults)) {
    const base = Array.isArray(target) ? target : [];
    return defaults.map((d, i) => (i < base.length ? fillMissing(base[i], d) : clone(d))).concat(base.slice(defaults.length));
  }
  if (isPlainObject(defaults)) {
    const base = isPlainObject(target) ? target : {};
    const out = { ...base };
    for (const key of Object.keys(defaults)) out[key] = fillMissing(base[key], defaults[key]);
    return out;
  }
  return target === undefined || target === null ? defaults : target;
}

// "heroTitle" → "hero Title" ، "cta_button" → "cta button"
export function humanize(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ");
}

// حقول بيديرها السيرفر — مش بتتعرض ولا بتتبعت من العميل.
export const META_KEYS = ["_id", "__v", "createdAt", "updatedAt"];

export function splitMeta(doc) {
  const meta = {};
  const body = {};
  for (const [k, v] of Object.entries(doc || {})) {
    if (META_KEYS.includes(k)) meta[k] = v;
    else body[k] = v;
  }
  return { meta, body };
}

export async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store",
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* body فاضي */
  }
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }
  return data;
}
