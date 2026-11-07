// app/career-dashboard/page.jsx — داشبورد الكارير. الحماية على السيرفر (كوكي الكارير المستقل).
import { redirect } from "next/navigation";
import { getCareerUser, CAREER_LOGIN_PATH } from "../lib/careerAuth";
import CareerShell from "./CareerShell";

export const dynamic = "force-dynamic";

export default async function CareerDashboardPage() {
  const user = await getCareerUser();
  if (!user) redirect(CAREER_LOGIN_PATH);
  return <CareerShell initialUser={{ name: user.name, email: user.email }} />;
}
