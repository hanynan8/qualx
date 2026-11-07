// app/api/career/me/route.js — بيانات صفحة الهوم (حساب الكارير + الملخص).
//
// myJobs / allJobs / webPhoneJobs حقيقية من career_assignments و career_jobs.
// certifications والأداء لسه بأصفار/null لحد ما ميزاتها تتضاف.
import mongoose from "mongoose";
import { connectToMongo } from "../../../lib/mongodb";
import { requireCareer, careerJson } from "../../../lib/careerAuth";
import {
  getCareerJobModel,
  getCareerAssignmentModel,
  ACTIVE_ASSIGNMENT_STATUSES,
} from "../../../lib/careerJobs";

export async function GET() {
  const { user, response } = await requireCareer();
  if (response) return response;

  // اكتمال البروفايل: الحقول المطلوبة وقت التسجيل (الاسم، الإيميل، الموبايل).
  const fields = [user.name, user.email, user.phone];
  const profileCompletion = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  let myJobs = 0;
  let allJobs = 0;
  let webPhoneJobs = 0;
  try {
    await connectToMongo();
    const Job = getCareerJobModel();
    [myJobs, allJobs, webPhoneJobs] = await Promise.all([
      getCareerAssignmentModel().countDocuments({
        accountId: new mongoose.Types.ObjectId(user.id),
        status: { $in: ACTIVE_ASSIGNMENT_STATUSES },
      }),
      Job.countDocuments({ status: "open", type: "onsite" }),
      Job.countDocuments({ status: "open", type: "web_phone" }),
    ]);
  } catch (err) {
    console.error("[career-me] counts error:", err);
  }

  return careerJson({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    summary: { profileCompletion, myJobs, allJobs, webPhoneJobs, certifications: 0, performance: null },
  });
}
