"use client";

// Part 1 of the "show the magic" pass: an inert, obviously-illustrative
// preview of what a restore looks like, shown only on a genuinely blank
// workspace. A plain text box gives no hint that a "restore" experience
// exists at all — this promises the payoff before the user has earned it.
// Nothing here is live data or a real interaction: pointer-events are off,
// it's visibly muted, and it's tagged "Example." One preview, not a
// gallery — it disappears the moment there's real content to work with.

export function RestorePreview({ onSeeExample }: { onSeeExample: () => void }) {
  return (
    <div className="mt-8">
      <p className="text-center text-sm font-bold uppercase tracking-wide text-ink-soft">
        This is what you&apos;ll come back to.
      </p>

      <div
        aria-hidden
        className="pointer-events-none relative mt-4 select-none rounded-card border border-line bg-mist p-6 opacity-60 sm:p-8"
      >
        <span className="absolute right-4 top-4 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
          Example
        </span>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-sage">
              Your next step
            </p>
            <p className="mt-1.5 text-xl font-bold leading-snug text-ink">
              Write two sentences on why Source B is more reliable.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">
              Where you were
            </p>
            <p className="mt-1.5 text-ink">
              Comparing two sources for your biology report.
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Also on your mind: whether to cite Source C.
            </p>
          </div>

          <div className="rounded-lg bg-paper p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-ask">
              One thing I&apos;m less sure about
            </p>
            <p className="mt-1.5 text-ink">
              It looks like you preferred Source B — was that right?
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 text-center">
        <button
          onClick={onSeeExample}
          className="rounded-md border border-line bg-mist px-5 py-2.5 font-bold text-ink transition-colors hover:border-sage"
        >
          See an example restore →
        </button>
      </div>
    </div>
  );
}
