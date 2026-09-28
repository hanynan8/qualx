// app/lib/mongodb.js
//
// ❌ المشكلة اللي كانت موجودة: app/api/data/route.js بيعمل
//    import { connectToMongo } from "@/app/lib/mongodb";
// لكن الملف ده مكانش موجود في الريبو أصلًا — يعني أي طلب لـ /api/data كان
// هيفشل فورًا بـ "Module not found: Can't resolve '@/app/lib/mongodb'"
// وقت الـ build/dev، قبل ما نوصل حتى لأي كود أمان جوه الراوت.
//
// ده standard pattern لـ Next.js + Mongoose: بنعمل cache للاتصال (والـ
// promise بتاعه) على globalThis عشان في serverless/dev مع Hot Reload
// منفتحش أكتر من اتصال واحد بالغلط مع كل إعادة تحميل للموديول.
import mongoose from "mongoose";

// نفس اسم المتغير اللي بيستخدمه scripts/seed.mjs بالظبط (MONGODB_URI مع
// fallback على MONGO_URI) عشان الاتنين يتكلموا مع نفس الداتابيز من غير
// لخبطة في أسماء متغيرات البيئة.
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI (or MONGO_URI) environment variable. Set it in .env.local locally, or in your hosting provider's environment variables in production."
  );
}

let cached = globalThis._mongooseConnection;
if (!cached) {
  cached = globalThis._mongooseConnection = { conn: null, promise: null };
}

export async function connectToMongo() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // 🔒 لو الاتصال فشل (URI غلط، الداتابيز واقعة، إلخ)، امسح الـ promise
    // المخزّنة عشان الطلب اللي بعده يعيد المحاولة بدل ما يفضل عالق على
    // نفس الوعد المرفوض.
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectToMongo;