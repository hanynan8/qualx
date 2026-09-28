// scripts/_shared.mjs — أدوات مشتركة لسكريبتات إدارة الحسابات (مش بتتشغل لوحدها).

import mongoose from "mongoose";
import readline from "node:readline";

// بيحمّل .env.local لو موجود (Node 20.12+/21.7+). لو الإصدار أقدم أو الملف
// مش موجود، بنكمّل عادي وبنعتمد على متغيرات البيئة الموجودة في الشيل.
for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile?.(f);
  } catch {
    /* الملف مش موجود — عادي */
  }
}

export async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ حط رابط الداتابيز في MONGODB_URI (أو MONGO_URI) في .env.local الأول.");
    process.exit(1);
  }
  await mongoose.connect(uri);
}

// نفس كولكشن "auth" اللي بيقراه الموقع. strict:false عشان ماننسفش أي حقول موجودة.
export function getUserModel() {
  const schema = new mongoose.Schema(
    { email: { type: String, lowercase: true, trim: true } },
    { strict: false, timestamps: true }
  );
  return mongoose.models.ScriptUser || mongoose.model("ScriptUser", schema, "auth");
}

export function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // بنكتم الحروف المكتوبة (الباسورد ماينفعش يظهر على الشاشة).
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
