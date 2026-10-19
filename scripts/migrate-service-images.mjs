// scripts/migrate-service-images.mjs
//
// بينقل روابط صور صفحة الخدمات (اللي كانت ثابتة في الكود) للداتابيز الشغّالة
// عشان تبقى ديناميك وتتعدّل من لوحة الأدمن → تاب "الخدمات".
//
// بيضيف بس لو الحقل فاضي/مش موجود (مش بيدوس على أي صورة غيّرتها بنفسك،
// ومش بيلمس أي نص تاني — عكس seed.mjs):
//   services.items[].image   (حسب الـ slug)
//   services.heroImage
//   services.introImage
//
// الاستخدام:   node scripts/migrate-service-images.mjs
// (لازم MONGODB_URI في .env.local أو في متغيرات البيئة، زي باقي السكريبتات.)

import mongoose from "mongoose";
import { connect } from "./_shared.mjs";
import { DEFAULT_IMAGES, DEFAULT_SERVICE_IMAGES } from "../app/lib/siteImageDefaults.mjs";

const isEmpty = (v) => typeof v !== "string" || v.trim() === "";

async function main() {
  await connect();
  const col = mongoose.connection.db.collection("services");
  const doc = await col.findOne({});

  if (!doc) {
    console.log('⚠️ مفيش document في كولكشن "services". شغّل node scripts/seed.mjs الأول.');
    await mongoose.disconnect();
    return;
  }

  const $set = {};
  const items = Array.isArray(doc.items) ? doc.items : [];
  items.forEach((item, i) => {
    const def = DEFAULT_SERVICE_IMAGES[item?.slug];
    if (def && isEmpty(item.image)) $set[`items.${i}.image`] = def;
  });
  if (isEmpty(doc.heroImage)) $set.heroImage = DEFAULT_IMAGES.solutionsHero;
  if (isEmpty(doc.introImage)) $set.introImage = DEFAULT_IMAGES.solutionsIntro;

  if (Object.keys($set).length === 0) {
    console.log("✓ كل الصور موجودة في الداتابيز بالفعل — مفيش حاجة تتغيّر.");
  } else {
    $set.updatedAt = new Date();
    await col.updateOne({ _id: doc._id }, { $set });
    console.log(`✓ اتضاف ${Object.keys($set).length - 1} رابط صورة:`);
    for (const k of Object.keys($set)) if (k !== "updatedAt") console.log(`  • ${k}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ فشل:", err);
  process.exit(1);
});
