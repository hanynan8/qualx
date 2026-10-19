// scripts/migrate-site-images.mjs
//
// بينقل روابط كل صور الموقع (اللي كانت ثابتة في الكود) للداتابيز الشغّالة
// عشان تتعدّل من لوحة الأدمن. بيضيف بس لو الحقل فاضي/مش موجود — مش بيدوس
// على أي صورة غيّرتها بنفسك ومش بيلمس أي نص (عكس seed.mjs). آمن تشغله أكتر
// من مرة.
//
//   services : items[].image (حسب الـ slug) + heroImage + introImage
//   home     : heroImage + aboutHeroImage + aboutWhoWeAreImage
//   careers  : heroImage
//   navbar   : logo
//
// الاستخدام:   node scripts/migrate-site-images.mjs
// (لازم MONGODB_URI أو MONGO_URI في .env.local أو في متغيرات البيئة.)

import mongoose from "mongoose";
import { connect } from "./_shared.mjs";
import { DEFAULT_IMAGES, DEFAULT_SERVICE_IMAGES } from "../app/lib/siteImageDefaults.mjs";

const isEmpty = (v) => typeof v !== "string" || v.trim() === "";

// حقول الصور على مستوى الـ document لكل كولكشن.
const TOP_LEVEL = {
  services: { heroImage: DEFAULT_IMAGES.solutionsHero, introImage: DEFAULT_IMAGES.solutionsIntro },
  home: {
    heroImage: DEFAULT_IMAGES.homeHero,
    aboutHeroImage: DEFAULT_IMAGES.aboutHero,
    aboutWhoWeAreImage: DEFAULT_IMAGES.aboutWhoWeAre,
  },
  careers: { heroImage: DEFAULT_IMAGES.careersHero },
  navbar: { logo: DEFAULT_IMAGES.logo },
};

async function migrate(db, name) {
  const col = db.collection(name);
  const doc = await col.findOne({});
  if (!doc) {
    console.log(`⚠️ ${name}: مفيش document. شغّل node scripts/seed.mjs الأول.`);
    return;
  }

  const $set = {};
  for (const [key, def] of Object.entries(TOP_LEVEL[name])) {
    if (isEmpty(doc[key])) $set[key] = def;
  }

  if (name === "services") {
    const items = Array.isArray(doc.items) ? doc.items : [];
    items.forEach((item, i) => {
      const def = DEFAULT_SERVICE_IMAGES[item?.slug];
      if (def && isEmpty(item.image)) $set[`items.${i}.image`] = def;
    });
  }

  const keys = Object.keys($set);
  if (keys.length === 0) {
    console.log(`✓ ${name}: كل الصور موجودة بالفعل.`);
    return;
  }
  $set.updatedAt = new Date();
  await col.updateOne({ _id: doc._id }, { $set });
  console.log(`✓ ${name}: اتضاف ${keys.length} رابط صورة:`);
  for (const k of keys) console.log(`  • ${k}`);
}

async function main() {
  await connect();
  const db = mongoose.connection.db;
  for (const name of Object.keys(TOP_LEVEL)) await migrate(db, name);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ فشل:", err);
  process.exit(1);
});
