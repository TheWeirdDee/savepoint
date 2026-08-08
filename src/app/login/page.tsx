import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Log in · Save Point",
  description: "Log in to pick up your thread where you left it.",
};

export default function LoginPage() {
  return (
    <div className="wrap flex min-h-[80vh] items-center py-14">
      <div className="w-full">
        <LoginForm />
      </div>
    </div>
  );
}
