// scripts/rename-merlix.mjs
//
// بيدوّر في كل الكولكشنز في الداتابيز على كلمة Merlix (بأي حالة حروف)
// وبيبدّلها بـ Merilex مع الحفاظ على شكل الحروف:
//   Merlix -> Merilex   |   merlix -> merilex   |   MERLIX -> MERILEX
//
// الاستخدام:
//   node scripts/rename-merlix.mjs            (تجربة فقط — بيعرض اللي هيتغيّر من غير ما يكتب)
//   node scripts/rename-merlix.mjs --apply    (تنفيذ فعلي)
//
// لازم MONGODB_URI (أو MONGO_URI) في .env.local. خد باك أب قبل --apply.

import mongoose from "mongoose";
import { connect } from "./_shared.mjs";

const APPLY = process.argv.includes("--apply");
const PATTERN = /merlix/gi;

// بيحافظ على حالة الحروف: Merlix -> Merilex
function replaceKeepCase(match) {
  if (match === match.toUpperCase()) return "MERILEX";
  if (match === match.toLowerCase()) return "merilex";
  if (match[0] === match[0].toUpperCase() && match.slice(1) === match.slice(1).toLowerCase())
    return "Merilex";
  // حالة مختلطة غريبة: نطبّق حالة كل حرف، والـ i الجديدة بتاخد حالة الـ r
  const c = (ch, src) => (src === src.toUpperCase() ? ch.toUpperCase() : ch.toLowerCase());
  const [m, e, r, l, i, x] = match;
  return c("m", m) + c("e", e) + c("r", r) + c("i", r) + c("l", l) + c("i", i) + c("x", x);
}

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

// بيمشي جوه الـ object/array ويبدّل في القيم النصية بس (مش المفاتيح ولا الـ ObjectId ولا التواريخ)
function transform(value, stats) {
  if (typeof value === "string") {
    const out = value.replace(PATTERN, (m) => {
      stats.count++;
      return replaceKeepCase(m);
    });
    return out;
  }
  if (Array.isArray(value)) return value.map((v) => transform(v, stats));
  if (isPlainObject(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = transform(v, stats);
    return out;
  }
  return value;
}

async function main() {
  await connect();
  const db = mongoose.connection.db;
  console.log(APPLY ? "⚠️  وضع التنفيذ الفعلي" : "🔍 وضع التجربة (من غير كتابة) — استخدم --apply للتنفيذ");

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  let totalDocs = 0;
  let totalReplacements = 0;

  for (const { name } of collections) {
    if (name.startsWith("system.")) continue;
    const col = db.collection(name);
    let docsChanged = 0;
    let replacements = 0;

    for await (const doc of col.find({})) {
      const stats = { count: 0 };
      const { _id, ...rest } = doc;
      const updated = transform(rest, stats);
      if (stats.count === 0) continue;

      docsChanged++;
      replacements += stats.count;
      if (APPLY) await col.replaceOne({ _id }, updated);
    }

    if (docsChanged) {
      console.log(`📁 ${name}: ${docsChanged} مستند / ${replacements} استبدال`);
    }
    totalDocs += docsChanged;
    totalReplacements += replacements;
  }

  console.log(
    `\n${APPLY ? "✅ تم" : "ℹ️ هيتم"}: ${totalReplacements} استبدال في ${totalDocs} مستند.`
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
