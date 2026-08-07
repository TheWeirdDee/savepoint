"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/client";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      router.push("/workspace");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[420px] rounded-card border border-line bg-mist p-8 shadow-card">
      <h1 className="text-2xl font-bold text-ink">Log in</h1>
      <p className="mt-2 text-ink-soft">Pick up your thread where you left it.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <Field label="Username" htmlFor="username">
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-ink focus:border-sage focus:outline-none"
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        New here?{" "}
        <Link href="/signup" className="font-bold text-sage underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}
