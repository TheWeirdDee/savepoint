import type { Metadata } from "next";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Sign up · Save Point",
};

export default function SignupPage() {
  return (
    <div className="wrap flex min-h-[80vh] items-center py-14">
      <div className="w-full">
        <SignupForm />
      </div>
    </div>
  );
}
