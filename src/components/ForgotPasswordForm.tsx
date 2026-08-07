"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const msg = await forgotPassword({ email: email.trim() });
      setMessage(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[420px] rounded-card border border-line bg-mist p-8 shadow-card">
      <h1 className="text-2xl font-bold text-ink">Reset your password</h1>
      <p className="mt-2 text-ink-soft">
        Enter the email you signed up with. We&apos;ll send a link to set a
        new password.
      </p>

      {message ? (
        <p role="status" className="mt-6 text-ink">
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-ink">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-ink focus:border-sage focus:outline-none"
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
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-soft">
        <Link href="/login" className="font-bold text-sage underline underline-offset-2">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
