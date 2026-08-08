"use client";

// The shared shape for both safety-net nudges (SAFETY-NET PASS): the
// on-load "you forgot to save" banner and the idle "you stepped away"
// offer. Same calm rules for both — dismissable, single action, no red,
// no time references (never "idle for 3 minutes" or "2 hours ago").

export function SavePlacePrompt({
  message,
  dismissLabel,
  saving,
  onSave,
  onDismiss,
}: {
  message: React.ReactNode;
  dismissLabel: string;
  saving: boolean;
  onSave: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="animate-rise rounded-card border border-sage/30 bg-sage/5 p-6">
      <p className="text-ink">{message}</p>
      <div className="mt-4 flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-sage px-6 py-3 font-bold text-paper hover:opacity-90 disabled:opacity-70 transition-opacity"
        >
          {saving ? "Saving…" : "Save my place"}
        </button>
        <button
          onClick={onDismiss}
          disabled={saving}
          className="rounded-lg px-4 py-3 text-ink-soft hover:text-ink disabled:opacity-60 transition-colors"
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}
