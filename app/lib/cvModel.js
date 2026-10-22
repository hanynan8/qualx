// app/lib/cvModel.js
//
// موديل طلبات التقديم بالـ CV (كولكشن "cv_applications"). الملف نفسه مش هنا —
// هنا بس بياناته (storage + key) عشان نقدر نقراه/نمسحه من cvStorage.js.
//
// ⚠️ الكولكشن ده في PROTECTED_COLLECTIONS (contentGuard.js و api/data) عشان محدش
// يعدّله/يمسحه من الـ API العام ويسيب ملف يتيم في التخزين. كل التعامل معاه من
// app/api/cv و app/api/admin/cv/* بس.

import mongoose from "mongoose";

const cvSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    position: { type: String, default: "" }, // الوظيفة المتقدَّم لها
    message: { type: String, default: "" },
    link: { type: String, default: "" }, // LinkedIn (اختياري)
    file: {
      storage: { type: String, required: true }, // "vercel-blob" | "local"
      key: { type: String, required: true }, // pathname في التخزين
      name: { type: String, required: true }, // الاسم الأصلي للعرض/التحميل
      size: { type: Number, required: true },
    },
  },
  { timestamps: true, strict: true }
);
cvSchema.index({ createdAt: -1 });

export function getCvModel() {
  return mongoose.models.Model_cv_applications || mongoose.model("Model_cv_applications", cvSchema, "cv_applications");
}
