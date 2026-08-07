"use client";

import { useState } from "react";

// Shown when the workspace loads with a ?capture= param — the landing spot
// for the mobile bookmarklet fallback (see /docs). Same capture-scope
// discipline as the extension: title, url, a selection, a short snippet.
// Never auto-saves — it's a confirmation, the same "one deliberate tap"
// principle as SavePointButton, just arriving from outside instead of from
// the workspace's own textarea.
export function PendingCaptureCard({
  capture,
  onSave,
  onDiscard,
}: {
  capture: { title?: string; url?: string };
  onSave: (note: string) => Promise<void>;
  onDiscard: () => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(note);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="animate-rise rounded-card border border-sage/30 bg-sage/5 p-6">
      <p className="text-lg font-bold text-ink">Save this page?</p>
      <p className="mt-1 text-ink-soft">
        You came from{" "}
        <span className="text-ink">
          &ldquo;{capture.title || capture.url || "a page you were reading"}&rdquo;
        </span>
        . Add a quick note if you want, or just save it.
      </p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. checking which source is more reliable"
        aria-label="Optional note"
        className="mt-3 w-full rounded-md border border-line bg-paper px-3 py-2 text-ink placeholder:text-ink-soft/60 focus:border-sage focus:outline-none"
      />
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-sage px-6 py-3 font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save my place"}
        </button>
        <button
          onClick={onDiscard}
          disabled={saving}
          className="rounded-lg px-4 py-3 text-ink-soft transition-colors hover:text-ink"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
