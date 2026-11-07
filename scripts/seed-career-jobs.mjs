// scripts/seed-career-jobs.mjs
//
// بيانات تجريبية لبوابة الكارير (للتجربة فقط): بيضيف كام وظيفة في كولكشن
// career_jobs، ولو اديته إيميل حساب كارير بيكلّفه بأول وظيفة (تظهر في My Jobs).
//
// الاستخدام:
//   node scripts/seed-career-jobs.mjs                      ← يضيف الوظايف بس
//   node scripts/seed-career-jobs.mjs someone@mail.com     ← + يكلّف الحساب بأول وظيفة
//   node scripts/seed-career-jobs.mjs --remove             ← يمسح الوظايف التجريبية وتكليفاتها
//
// الوظايف التجريبية معلّمة بـ seed:true فبتتمسح لوحدها من غير ما تلمس أي وظيفة حقيقية.

import mongoose from "mongoose";
import { connect } from "./_shared.mjs";

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

const SAMPLE = [
  {
    title: "Mystery Shopping — Fine Dining Restaurant",
    client: "Demo Client A",
    city: "Cairo",
    lat: 30.0444,
    lng: 31.2357,
    type: "onsite",
    compensation: "400 EGP",
    reimbursement: "Up to 600 EGP",
    firstDate: day(1),
    lastDate: day(14),
    description: "Visit the restaurant as a regular guest, evaluate service, food quality and cleanliness, then submit the report within 24 hours.\n\nBudget for the meal is reimbursed after approval.",
  },
  {
    title: "Mystery Shopping — Mobile Retail Store",
    client: "Demo Client B",
    city: "Giza",
    lat: 30.0131,
    lng: 31.2089,
    type: "onsite",
    compensation: "300 EGP",
    reimbursement: "-",
    firstDate: day(2),
    lastDate: day(10),
    description: "Evaluate the sales process, product knowledge and after-sales information.",
  },
  {
    title: "Branch Audit — Bank Branch",
    client: "Demo Client C",
    city: "Alexandria",
    lat: 31.2001,
    lng: 29.9187,
    type: "onsite",
    compensation: "500 EGP",
    reimbursement: "Transport covered",
    firstDate: day(3),
    lastDate: day(20),
    description: "Operational audit visit following the provided checklist.",
  },
  {
    title: "Call-Center Mystery Call",
    client: "Demo Client D",
    city: "",
    type: "web_phone",
    compensation: "150 EGP",
    reimbursement: "-",
    firstDate: day(0),
    lastDate: day(30),
    description: "Place a phone call to the customer-service line and evaluate the interaction.",
  },
];

async function main() {
  await connect();
  const jobs = mongoose.connection.collection("career_jobs");
  const assignments = mongoose.connection.collection("career_assignments");

  const arg = process.argv[2];

  if (arg === "--remove") {
    const demo = await jobs.find({ seed: true }, { projection: { _id: 1 } }).toArray();
    const ids = demo.map((d) => d._id);
    const a = await assignments.deleteMany({ jobId: { $in: ids } });
    const j = await jobs.deleteMany({ seed: true });
    console.log(`تم مسح ${j.deletedCount} وظيفة تجريبية و ${a.deletedCount} تكليف.`);
    return;
  }

  let firstId = null;
  let added = 0;
  for (const s of SAMPLE) {
    const exists = await jobs.findOne({ seed: true, title: s.title });
    if (exists) {
      firstId ??= exists._id;
      continue;
    }
    const now = new Date();
    const res = await jobs.insertOne({
      logoUrl: "",
      address: "",
      lat: null,
      lng: null,
      status: "open",
      ...s,
      seed: true,
      createdAt: now,
      updatedAt: now,
      __v: 0,
    });
    firstId ??= res.insertedId;
    added++;
  }
  console.log(`تمت إضافة ${added} وظيفة تجريبية.`);

  if (arg) {
    const email = arg.toLowerCase().trim();
    const acc = await mongoose.connection.collection("career_accounts").findOne({ email });
    if (!acc) {
      console.error(`مفيش حساب كارير بالإيميل ${email} — سجّل الحساب من /career-dashboard/login الأول.`);
      process.exitCode = 1;
      return;
    }
    const now = new Date();
    const r = await assignments.updateOne(
      { jobId: firstId, accountId: acc._id },
      { $setOnInsert: { status: "assigned", assignedAt: now, createdAt: now, updatedAt: now, __v: 0 } },
      { upsert: true }
    );
    console.log(r.upsertedCount ? `تم تكليف ${email} بأول وظيفة.` : `${email} مكلّف بالفعل.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
