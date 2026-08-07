# Save Point — Design System (ND-first)

The discipline is **subtraction**: every element is a small tax on working memory and attention. Remove, delay, or collapse until the person faces only the one thing that matters now. The whole visual language is calm, low-glare, and legibility-first — this is both the accessibility requirement (25%) and the product's own thesis (reduce the cost of re-entry).

## 1. Color tokens (CSS variables)

Low-saturation, warm, no pure white, no default AI cream/terracotta. Set these on `:root` in `globals.css`.

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F7F6F2` | Background. Warm off-white — reduces glare vs pure white (a sensory-sensitivity requirement). Never `#FFFFFF`. |
| `--ink` | `#2A2E2D` | Primary text. Soft near-black — avoids the harsh contrast of pure black on paper. Never `#000000` on `--paper`. |
| `--ink-soft` | `#5C625F` | Secondary text, captions. |
| `--mist` | `#ECEAE3` | Collapsed / secondary surfaces ("More context", cards). |
| `--line` | `#DAD7CE` | Hairline borders, dividers. |
| `--sage` | `#3A6B63` | Calm primary accent — focus, primary actions, "harbor". |
| `--marker` | `#C8823C` | The single **signature** accent — the "save-point marker". Used sparingly, only for save-point moments. |
| `--ask` | `#6B72A6` | Gentle uncertainty tone for confidence questions. Periwinkle — deliberately **not red**. |

Spend boldness in one place (`--marker`); keep everything else quiet.

## 2. Typography

- **Default face:** **Atkinson Hyperlegible** — purpose-built for maximum legibility. The typeface itself is the accessibility statement.
- **Dyslexia mode:** **Lexend** — designed to improve reading proficiency. Toggled in the AccessibilityBar.
- Both via `next/font/google`, exposed as CSS variables; the active face is chosen by a `<html>` data attribute.
- Base size **≥ 18px**; line-height **≥ 1.6**; reading width **≤ 640px**; **left-aligned, never justified** (justified text creates uneven "rivers" that dyslexic readers lose their place in).
- Type scale is minimal: one large display size (restore's next action), one heading, one body, one caption. Hierarchy by size/weight, not color noise.

## 3. Spacing, radius, density

- Generous whitespace; low density. Cramped UI spikes cognitive load.
- Spacing scale (rem): 0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3. Prefer the larger end between blocks.
- Radius: soft, consistent (e.g. 10px cards, 8px controls). No sharp broadsheet hairline aesthetic.
- One primary action per screen; everything else demoted or collapsed.

## 4. Motion

- Minimal and optional. Honor `prefers-reduced-motion` **and** provide an in-app reduced-motion toggle.
- No auto-playing motion, no bouncing, no confetti, no attention-hijacking animation.
- Durations short (120–200ms), easing gentle.

## 5. Signature element — the save-point marker

A small circular checkpoint glyph (a filled ring in `--marker`). It anchors each saved point and each restore. **On save:** one gentle single pulse (scale/opacity), skipped entirely under reduced motion. This is the one bold moment; nothing else animates. The gaming "save point" metaphor is the memorable hook — keep it quiet and singular, not decorative.

## 6. Component patterns

- **Save button:** one tap; large, calm, `--sage`; instant; no confirm modal. Optional note input below it (never required, dictation affordance present).
- **Restore offer:** a single calm line on load — "Welcome back. Restore where you were?" — pull, not push. No auto-expansion of content.
- **Restore card:** vertical hierarchy, top to bottom —
  1. **Your next step** — largest text on the screen, the one physical action.
  2. **Where you were** — plain second-person sentences (objective / stopping point / main thread).
  3. **One thing I'm less sure about** — gentle confirmation in `--ask` with `[Yes] [No, it was A]`.
  4. **▸ More context** — collapsed: open threads, captured tabs, original note, full reconstruction, history.
- **ConfidenceLine:** renders a field in the voice for its tier — high = statement, medium = hedge, low = question.
- **Lists / history:** no notification badges, no red dots, no infinite scroll. Quiet rows.
- **AccessibilityBar:** compact, unobtrusive; font / size / reduced-motion; persisted.

## 7. Accessibility rules (enforce everywhere)

- Progressive disclosure — never render the full tab list / full tree by default.
- No required form fields anywhere in the core flow; inputs optional and dictatable.
- Full keyboard navigation; always-visible focus rings; logical tab order.
- ARIA labels on every control; screen-reader-sensible structure and live regions for restore output.
- Forgiving actions: easy undo, no scary "are you sure" modals.
- Don't rely on color alone to convey meaning (pair with text/shape).

## 8. Voice & tone (copy is design material)

- Warm, plain, second person, short sentences.
- Active voice; a control says exactly what happens ("Save your state", not "Submit"); the same name persists through the flow ("Restore" → "Restored").
- **Never** reference elapsed time; **never** shame or imply deficit; no streaks, no guilt.
- Empty states are invitations, not mood. Errors explain what happened and how to fix it, in the interface's voice, never apologetic or vague.
- Name things by what the person controls, not how the system is built.

## 9. Chanel test

Before shipping any screen: remove one thing. If a decoration doesn't serve re-entry or legibility, cut it.
