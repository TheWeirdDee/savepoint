import type { Confidence } from "@/lib/types";

// The model already words each field by tier (statement / hedge / question).
// This component adds only a quiet visual cue — a colored thread marker —
// so uncertainty is felt gently, never shown as a scary "LOW CONFIDENCE" flag.
// high -> sage (calm, stated). medium -> marker (hedge). low -> ask (question).

const TIER_COLOR: Record<Confidence, string> = {
  high: "bg-sage",
  medium: "bg-marker",
  low: "bg-ask",
};

export function ConfidenceLine({
  label,
  text,
  confidence,
}: {
  label?: string;
  text: string;
  confidence: Confidence;
}) {
  if (!text.trim()) return null;
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className={`mt-2 h-2 w-2 shrink-0 rounded-full ${TIER_COLOR[confidence]}`}
      />
      <p className="text-ink">
        {label ? <span className="text-ink-soft">{label} </span> : null}
        {text}
      </p>
    </div>
  );
}
