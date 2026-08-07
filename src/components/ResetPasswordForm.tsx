"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/client";
import { PasswordField } from "./PasswordField";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword({ token, password });
      router.push("/workspace");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[420px] rounded-card border border-line bg-mist p-8 shadow-card">
      <h1 className="text-2xl font-bold text-ink">Set a new password</h1>
      <p className="mt-2 text-ink-soft">At least 8 characters.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-ink">
            New password
          </label>
          <PasswordField
            id="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-ask">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-sage px-5 py-3 font-bold text-paper transition-colors hover:bg-sage-bright disabled:opacity-70"
        >
          {submitting ? "Saving…" : "Set new password"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        <Link href="/login" className="font-bold text-sage underline underline-offset-2">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
