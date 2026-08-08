// The one signature glyph — "a small circular checkpoint glyph, a filled
// ring" per the design system. Used everywhere the wordmark, an eyebrow, a
// step marker, or a footer needs the save-point mark, so there is exactly
// one visual language for it, not a CSS dot in some places and this
// character in others. Always aria-hidden — it's decorative, the
// surrounding text carries the meaning.
export function MarkerDot({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`text-marker ${className}`}>
      ◍
    </span>
  );
}
