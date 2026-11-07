// app/api/career/auth/logout/route.js
import { clearCareerSession, careerJson } from "../../../../lib/careerAuth";

export async function POST() {
  await clearCareerSession();
  return careerJson({ ok: true });
}
