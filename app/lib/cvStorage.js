// app/lib/cvStorage.js
//
// طبقة التخزين الوحيدة للـ CVs. كل الراوتس بتكلّم الـ 3 دوال دول بس
// (saveCv / readCv / deleteCv) — فلما تغيّر الاستضافة، بتضيف adapter جديد هنا
// وبس ومتلمسش أي حاجة تانية.
//
// الـ adapters:
//  • "vercel-blob" : الافتراضي لما BLOB_READ_WRITE_TOKEN يكون متظبط (Vercel Blob).
//                    الملفات بتتخزن PRIVATE: مفيش لينك عام، والأدمن بس بيقرأها عن
//                    طريق /api/admin/cv/[id] (اللي بتتحقق من الـ role).
//  • "local"       : للتطوير بس (NODE_ENV !== production) لما مفيش token —
//                    الملفات بتتحط في .data/cv/ (متجاهلة في git).
//
// كل CV في الداتابيز بيتخزن معاه `file.storage` (اسم الـ adapter اللي اتحفظ بيه)،
// فالملفات القديمة تفضل تتقرا حتى لو بدّلت الـ adapter الافتراضي بعدين.
//
// CV_BLOB_ACCESS=public : لو الـ Blob store بتاعك اتعمل Public (مش موصى بيه للـ CVs).

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { put, get, del } from "@vercel/blob";

const BLOB_ACCESS = process.env.CV_BLOB_ACCESS === "public" ? "public" : "private";
const LOCAL_DIR = path.join(process.cwd(), ".data", "cv");
const LOCAL_KEY_RE = /^[0-9a-f-]{36}\.pdf$/;

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("CV storage is not configured (missing BLOB_READ_WRITE_TOKEN)");
    this.name = "StorageNotConfiguredError";
  }
}

function defaultProvider() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "vercel-blob";
  if (process.env.NODE_ENV !== "production") return "local";
  throw new StorageNotConfiguredError();
}

/** بيحفظ الـ PDF ويرجّع { storage, key } — الاتنين بيتخزنوا مع طلب التقديم. */
export async function saveCv(buffer) {
  const storage = defaultProvider();
  const id = randomUUID();

  if (storage === "vercel-blob") {
    const year = new Date().getFullYear();
    // اسم الملف المخزّن عشوائي (UUID) — مش بنستخدم اسم الملف اللي بعته المستخدم.
    const blob = await put(`cvs/${year}/${id}.pdf`, buffer, {
      access: BLOB_ACCESS,
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return { storage, key: blob.pathname };
  }

  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const key = `${id}.pdf`;
  await fs.writeFile(path.join(LOCAL_DIR, key), buffer);
  return { storage, key };
}

/** بيرجّع { body, size } (body = stream أو Buffer صالح لـ new Response) أو null لو الملف مش موجود. */
export async function readCv({ storage, key }) {
  if (storage === "vercel-blob") {
    const res = await get(key, { access: BLOB_ACCESS });
    if (!res || res.statusCode !== 200) return null;
    return { body: res.stream, size: res.blob.size };
  }

  if (storage === "local") {
    if (!LOCAL_KEY_RE.test(key)) return null; // منع path traversal
    try {
      const buf = await fs.readFile(path.join(LOCAL_DIR, key));
      return { body: buf, size: buf.length };
    } catch (err) {
      if (err.code === "ENOENT") return null;
      throw err;
    }
  }

  throw new Error(`Unknown CV storage adapter: ${storage}`);
}

/** بيمسح الملف. لو مش موجود أصلًا مش بيرمي error. */
export async function deleteCv({ storage, key }) {
  if (storage === "vercel-blob") {
    await del(key);
    return;
  }

  if (storage === "local") {
    if (!LOCAL_KEY_RE.test(key)) return;
    await fs.unlink(path.join(LOCAL_DIR, key)).catch((err) => {
      if (err.code !== "ENOENT") throw err;
    });
    return;
  }

  throw new Error(`Unknown CV storage adapter: ${storage}`);
}
