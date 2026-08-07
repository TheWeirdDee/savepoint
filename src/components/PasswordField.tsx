"use client";

import { useState } from "react";

// A password input with a show/hide toggle. Small, but a real accessibility
// win: a typo in a password field is otherwise completely invisible, which
// is an unnecessary tax on anyone re-typing it blind.
export function PasswordField({
  id,
  name,
  autoComplete,
  value,
  onChange,
  minLength,
  required,
}: {
  id: string;
  name: string;
  autoComplete?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minLength?: number;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        minLength={minLength}
        required={required}
        className="w-full min-w-0 rounded-md border border-line bg-paper px-3 py-2.5 text-ink focus:border-sage focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="shrink-0 rounded-md border border-line px-3 py-2.5 text-sm font-bold text-ink-soft transition-colors hover:text-ink"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
