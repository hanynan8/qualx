// app/login/page.jsx — تسجيل الدخول. الفورم كله في components/auth/AuthForm.jsx.
import { Suspense } from "react";
import AuthForm from "../components/auth/AuthForm";

export const metadata = { title: "Sign in — Merlix" };

// useSearchParams (جوه AuthForm) محتاج Suspense boundary وقت الـ build.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
