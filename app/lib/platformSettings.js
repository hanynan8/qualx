// app/lib/platformSettings.js
//
// إعدادات المنصة اللي الأدمن بيتحكم فيها من اللوحة (document واحد في كولكشن
// "platform_settings"). المتغيرات البيئية (REGISTRATION_ENABLED /
// CAREER_REGISTRATION_ENABLED = "false") لسه ليها الأولوية: لو اتقفلت من الـ env
// يفضل التسجيل مقفول بغض النظر عن اللوحة (قفل طوارئ من الاستضافة).

import mongoose from "mongoose";
import { connectToMongo } from "./mongodb";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    siteRegistrationEnabled: { type: Boolean, default: true },
    careerRegistrationEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export function getPlatformSettingsModel() {
  return (
    mongoose.models.Model_platform_settings ||
    mongoose.model("Model_platform_settings", settingsSchema, "platform_settings")
  );
}

export const SETTING_KEYS = ["siteRegistrationEnabled", "careerRegistrationEnabled"];

export async function getPlatformSettings() {
  await connectToMongo();
  const doc = await getPlatformSettingsModel().findOne({ key: "main" }).lean();
  return {
    siteRegistrationEnabled: doc?.siteRegistrationEnabled !== false,
    careerRegistrationEnabled: doc?.careerRegistrationEnabled !== false,
  };
}

/** هل التسجيل مفتوح؟ الـ env أقوى من اللوحة. لو قراءة الإعدادات فشلت بنفترض "مفتوح". */
export async function isRegistrationOpen(kind) {
  const envFlag = kind === "career" ? process.env.CAREER_REGISTRATION_ENABLED : process.env.REGISTRATION_ENABLED;
  if (envFlag === "false") return false;
  try {
    const s = await getPlatformSettings();
    return kind === "career" ? s.careerRegistrationEnabled : s.siteRegistrationEnabled;
  } catch (err) {
    console.error("[platformSettings] read failed (defaulting to open):", err);
    return true;
  }
}

export function envLocks() {
  return {
    siteRegistrationEnabled: process.env.REGISTRATION_ENABLED === "false",
    careerRegistrationEnabled: process.env.CAREER_REGISTRATION_ENABLED === "false",
  };
}
