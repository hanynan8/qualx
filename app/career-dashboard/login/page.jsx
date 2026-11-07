// app/career-dashboard/login/page.jsx — لوجن بوابة الكارير (حسابات مستقلة).
import { redirect } from "next/navigation";
import { getCareerUser, CAREER_DASHBOARD_PATH } from "../../lib/careerAuth";
import CareerLoginForm from "./CareerLoginForm";

export const metadata = { title: "Career Portal — Log in" };
export const dynamic = "force-dynamic";

export default async function CareerLoginPage() {
  const user = await getCareerUser();
  if (user) redirect(CAREER_DASHBOARD_PATH);
  return <CareerLoginForm />;
}
