import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set a new password · Save Point",
  description: "Choose a new password for your Save Point account.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="wrap flex min-h-[80vh] items-center py-14">
      <div className="w-full">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
