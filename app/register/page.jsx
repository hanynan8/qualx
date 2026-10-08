// app/register/page.jsx — إنشاء حساب. الفورم كله في components/auth/AuthForm.jsx.
import { Suspense } from "react";
import AuthForm from "../components/auth/AuthForm";

export const metadata = { title: "Create account — Merlix" };

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
