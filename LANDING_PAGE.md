# Save Point — Landing Page Spec + Copy

**Route:** `src/app/page.tsx` (public). **Job:** communicate the product and its thesis clearly enough that a judge, a student, or a teacher gets it in ten seconds, and one tap into the workspace. Uses the same design system (calm, low-glare, Atkinson Hyperlegible, `--sage` primary, `--marker` signature). Single column, ≤640px reading width, fully responsive, no marketing fluff.

The copy below is paste-ready. Use it as written or lightly edit; keep the voice (plain, warm, second person, active, no time/shame language).

---

## Wireframe

```
┌───────────────────────────────────────────────┐
│  ◍ Save Point                                  │   ← small marker glyph + wordmark
│                                                │
│  Most tools restore your files.                │   ← HERO (largest text)
│  Save Point restores where your                │
│  thinking left off.                            │
│                                                │
│  [ Open the workspace → ]                      │   ← single primary CTA (--sage)
│                                                │
├───────────────────────────────────────────────┤
│  The problem                                   │
│  (one short paragraph, strengths-framed)       │
├───────────────────────────────────────────────┤
│  How it works                                  │
│  ◍ 1  Save your state      (one tap)           │
│  ◍ 2  Get interrupted, leave                   │
│  ◍ 3  Restore your thinking, not your tabs     │
├───────────────────────────────────────────────┤
│  When it's unsure, it asks                     │
│  (one short paragraph on the honesty layer)    │
├───────────────────────────────────────────────┤
│  Who it's for                                  │
│  (one short, honest paragraph)                 │
│                                                │
│  [ Open the workspace → ]                      │   ← CTA repeat
│  ◍ Save Point · built for how you think        │   ← quiet footer
└───────────────────────────────────────────────┘
```

---

## Section-by-section copy

### Wordmark
`◍ Save Point`  (marker glyph + name; the ◍ is the save-point marker)

### Hero (largest text on the page)
> **Most tools restore your files.**
> **Save Point restores where your thinking left off.**

### Primary CTA (button, `--sage`)
`Open the workspace →`  (links to `/workspace`)

### The problem
> When you're interrupted mid-assignment, you don't lose your files. You lose the thread — why you were reading this, which idea you'd already ruled out, what you were about to write next. Rebuilding that from memory is the hard part. Save Point holds it for you, so getting back in costs almost nothing. It doesn't ask you to focus harder. It just makes stepping away cheap.

### How it works (three steps, each with a marker glyph)
1. **Save your state.** One tap — add a quick note if you want, or don't. That's it.
2. **Get interrupted. Leave.** Life happens. Close the tab.
3. **Restore your thinking, not your tabs.** Come back to one clear next step, where you were, and what you'd figured out — not a wall of windows.

### When it's unsure, it asks
> Save Point never pretends to know more than it does. When it isn't sure where you left off, it asks you one simple question instead of inventing an answer — because a confident wrong guess is worse than none.

### Who it's for
> Save Point is built for neurodivergent students — designed from the lived experience of an ADHD builder who kept losing the thread every time work got interrupted. If that's you, this was made for the way your mind actually works.

### CTA repeat (button, `--sage`)
`Open the workspace →`

### Footer (quiet, `--ink-soft`)
`◍ Save Point · built for how you think`

---

## Visual direction

- Calm, low-glare, generous whitespace. `--paper` background, `--ink` text, `--sage` for the CTA, `--marker` only on the glyphs and step numbers.
- Hero is type-led — the thesis line *is* the hero. No hero image, no gradient, no big number.
- The three "how it works" steps use the marker glyph as the step marker (a real sequence, so numbering is justified).
- One signature touch allowed: a single gentle pulse of the wordmark marker on load (skipped under reduced motion). Nothing else animates.
- Mobile: everything stacks; CTA full-width; type stays ≥18px; still ≤ comfortable reading width.

## Do / Don't

- **Do:** plain, warm, confident copy; one primary action; honest about audience.
- **Don't:** fake testimonials, stock-photo vibe, feature-grid, pricing, badges, countdowns, elapsed-time or shame language, deficit framing ("struggle with focus"), or more than one primary CTA style.

## Accessibility

- Semantic headings (one `h1` = the thesis), landmark regions, visible focus, keyboard-reachable CTA, sufficient (but soft) contrast, `prefers-reduced-motion` honored. The page must read cleanly with a screen reader and at 200% zoom.
