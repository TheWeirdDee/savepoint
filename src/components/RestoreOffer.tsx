"use client";

import type { SavePoint } from "@/lib/types";
import { savePointLabel } from "@/lib/client";

// Shown on workspace load when an unrestored save point exists. It offers —
// it does not auto-open the reconstruction. Re-entry is a pull, never a push.
// No time references ("2 hours ago"): time-guilt lands badly for time-blindness.

export function RestoreOffer({
  savePoint,
  onRestore,
  onDismiss,
}: {
  savePoint: SavePoint;
  onRestore: () => void;
  onDismiss: () => void;
}) {
  const label = savePointLabel(savePoint);
  const hint = label === "Saved session" ? "your last session" : label;

  return (
    <div className="animate-rise rounded-card border border-sage/30 bg-sage/5 p-6">
      <p className="text-lg font-bold text-ink">Welcome back.</p>
      <p className="mt-1 text-ink-soft">
        You left a save point on{" "}
        <span className="text-ink">&ldquo;{hint}&rdquo;</span>. Want to pick up
        where your thinking left off?
      </p>
      <div className="mt-4 flex gap-3">
        <button
          onClick={onRestore}
          className="rounded-lg bg-sage px-6 py-3 font-bold text-paper hover:opacity-90 transition-opacity"
        >
          Restore where I was
        </button>
        <button
          onClick={onDismiss}
          className="rounded-lg px-4 py-3 text-ink-soft hover:text-ink transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
