// scripts/update-contact.mjs
//
// بيحدّث بيانات التواصل في الداتابيز الشغّالة (الإيميل + الفيسبوك + الواتساب)
// من غير ما يلمس أي حاجة تانية (عكس seed.mjs اللي بيكتب المستند كله من جديد
// وممكن يمسح تعديلات الأدمن).
//
// بيعدّل بس:
//   footer.contact.email / footer.contact.facebook / footer.contact.whatsapp
//   careers.contactEmail
//
// الاستخدام:   node scripts/update-contact.mjs
// (لازم MONGODB_URI في .env.local أو في متغيرات البيئة، زي باقي السكريبتات.)

import mongoose from "mongoose";
import { connect } from "./_shared.mjs";

const CONTACT = {
  email: "Merilex.Consulting@gmail.com",
  facebook: "https://www.facebook.com/share/1CV676z1E4/",
  whatsapp: "https://wa.me/201210245637",
};

async function main() {
  await connect();
  const db = mongoose.connection.db;
  const now = new Date();

  const footer = db.collection("footer");
  const footerDoc = await footer.findOne({});
  if (footerDoc) {
    console.log("footer.contact (قبل):", footerDoc.contact || {});
    await footer.updateMany(
      {},
      {
        $set: {
          "contact.email": CONTACT.email,
          "contact.facebook": CONTACT.facebook,
          "contact.whatsapp": CONTACT.whatsapp,
          updatedAt: now,
        },
      }
    );
    console.log("footer.contact (بعد): ", (await footer.findOne({})).contact);
  } else {
    console.log('⚠️ مفيش مستند في كولكشن "footer" — شغّل seed.mjs الأول (أو سيبه والموقع هيستخدم الافتراضي).');
  }

  const careers = db.collection("careers");
  const careersDoc = await careers.findOne({});
  if (careersDoc) {
    console.log("careers.contactEmail (قبل):", careersDoc.contactEmail);
    await careers.updateMany({}, { $set: { contactEmail: CONTACT.email, updatedAt: now } });
    console.log("careers.contactEmail (بعد): ", (await careers.findOne({})).contactEmail);
  } else {
    console.log('⚠️ مفيش مستند في كولكشن "careers".');
  }

  console.log("✅ تم.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ فشل:", err);
  process.exit(1);
});
