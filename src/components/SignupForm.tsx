"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/client";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup({
        email: email.trim(),
        fullName: fullName.trim(),
        username: username.trim(),
        password,
      });
      router.push("/workspace");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[420px] rounded-card border border-line bg-mist p-8 shadow-card">
      <h1 className="text-2xl font-bold text-ink">Create an account</h1>
      <p className="mt-2 text-ink-soft">
        Free, no card. Your password is hashed — nobody, including us, can read it back.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <Field label="Email" htmlFor="email">
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
        </Field>

        <Field label="Full name" htmlFor="fullName">
          <input
            id="fullName"
            name="fullName"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-ink focus:border-sage focus:outline-none"
          />
        </Field>

        <Field label="Username" htmlFor="username" hint="At least 3 characters, no spaces.">
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            required
            className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-ink focus:border-sage focus:outline-none"
          />
        </Field>

        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-ink focus:border-sage focus:outline-none"
          />
        </Field>

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
          {submitting ? "Creating your account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Already have one?{" "}
        <Link href="/login" className="font-bold text-sage underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}
