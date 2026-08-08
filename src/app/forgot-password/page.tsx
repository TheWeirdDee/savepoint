import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset password · Save Point",
  description: "Get a password reset link sent to your email.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="wrap flex min-h-[80vh] items-center py-14">
      <div className="w-full">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
