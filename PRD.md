# Save Point — Product Requirements Document

## 1. One-line

Most tools restore your files. **Save Point restores where your thinking left off** — an AI re-entry tool for neurodivergent (primarily ADHD) K–12 students.

## 2. Problem

Existing productivity tools — browser tab managers, note apps, IDE session restore, work journals — optimize for **storing information**. None are built around **restoring cognitive context** after an interruption.

When an interrupted ADHD student comes back, their files are still open, but the thing that made the work make sense is gone: *why they were reading this paragraph, which idea they'd already ruled out, which of five open threads was the main one, what they were about to type next.* Rebuilding that mental state from cold is so expensive that students avoid it — which looks like "abandoning things halfway." The lost artifact is cognitive, not documentary.

## 3. Insight & framing

The product does **not** try to fix the student's attention or reduce interruptions. It makes interruption **cheap**, which protects deep focus. It treats the student's way of thinking as the thing worth preserving, not a deficit to correct.

**Framing rule (applies to all copy, UI, and AI output):** strengths-based, never deficit or shame. No "you got distracted," no elapsed-time guilt ("you've been away 2 hours"), no streaks. Never reference how long the student was gone.

## 4. Target users

- **Primary:** neurodivergent (primarily ADHD) K–12 students doing schoolwork — researching, writing essays, reading, problem-solving, preparing presentations.
- **Design authority:** built from the lived experience of an ADHD developer. Design *intent* is K–12 learning; scenarios in demos/copy are unmistakably educational (biology report, history essay, science investigation).

### Personas
- **Ada, 15, ADHD.** Writing a biology report across several source tabs. Gets pulled away mid-comparison; returning, she can't remember which source she'd judged stronger or why. Needs the *reasoning* back, not the tabs.
- **Sam, 13, ADHD + dyslexia.** Reads slowly; a dense restore summary feels like "more homework." Needs one small next action and readable, plain text.

## 5. User stories

1. Mid-assignment, I save my cognitive state in **one tap**, optionally adding one short note (typed or dictated), so saving never breaks my flow.
2. Returning later, I'm **quietly offered** a restore — never force-fed a wall of information.
3. On restore, I see **one next physical action first**, then where I was, then a gentle confirmation of anything uncertain, with everything else collapsed.
4. When the tool is unsure, it **asks me a question** instead of pretending — and I can correct it.
5. Working across many tabs on a laptop, I can save from **any web page** via the extension, and restore back in the calm workspace.
6. I can adjust the interface (dyslexia-friendly font, larger text, reduced motion), and it never overwhelms me.

## 6. Functional requirements

- **FR1** Create a save point from the workspace (note + document/tab context).
- **FR2** Create a save point from the extension (note + active tab + selected text + page snippet + open-tab titles).
- **FR3** Persist save points so they survive closing the browser and returning later.
- **FR4** Reconstruct a save point into a structured cognitive-state object via the AI.
- **FR5** Cache the reconstruction on the record; mark the point restored.
- **FR6** On workspace load, if an unrestored save point exists, offer restore — one calm line (pull, not push).
- **FR7** Restore screen: next-action-first, confidence-tiered voice, collapsed secondary detail.
- **FR8** User can confirm/correct an uncertain decision (e.g. "Was it B?" → Yes / No, it was A).
- **FR9** Low-context path: when signal is thin, ask one orienting question instead of fabricating.
- **FR10** Accessibility controls: font (Atkinson Hyperlegible ↔ Lexend dyslexia mode), text size, reduced motion — persisted locally.
- **FR11** A public landing page communicating the product and its thesis.

## 7. The AI requirement (what "meaningful AI" means here)

Not a chatbot. The model **fuses incomplete signals** (optional note + document + selected text + active tab + open tabs) into the cognitive state most useful for re-entry, tagging each inference with a confidence **tier** (`high | medium | low`) that controls how it speaks, and **refuses to fabricate**: when signal is thin it sets a low-context flag and asks one orienting question rather than inventing a confident, wrong account of the student's own mind. A confidently wrong reconstruction is worse than none — the student would trust and act on it.

## 8. Non-goals (explicitly OUT)

Collaboration, teacher dashboards, automatic interruption detection, continuous/passive monitoring, browser-history reading, full rich-text editor, calendar/reminders, gamification, OAuth, email verification. One user, one document at a time, manual save points. (Simple username/password accounts were added after this PRD's first draft — see [README.md](README.md#accounts) — but the exclusions above, and the "one user, one document" scope, still hold.)

## 9. Constraints

- Stack fixed: Next.js (latest, App Router, TS, `src/`), Tailwind, **webpack (never Turbopack)**, Supabase, **free Groq (primary) with Gemini as an automatic fallback** for AI.
- Chrome extension is **desktop-only** (MV3 does not run on mobile browsers); the web app covers mobile.
- Zero paid services. Gemini free tier + Supabase free tier only.
- No git operations by the build agent.

## 10. Success — rubric mapping (IncludAI / Stanford NNEA)

- **Impact on ND youth — 30%:** solves the under-served re-entry problem; strengths-framed; designed by one neurodivergent (ADHD) student from lived experience. Dyslexia-user testing is planned but not yet completed; see [README.md](README.md#neurodivergent-user-evidence).
- **Innovation in AI — 25%:** sparse-signal fusion + confidence tiers + no-fabrication low-context path.
- **Usability & accessibility — 25%:** one-action save, next-action-first restore, progressive disclosure, dyslexia mode, reduced motion, keyboard/ARIA.
- **Technical execution — 10%:** clean build, shared schema, structured AI output, persistence, working extension.
- **Presentation — 10%:** landing-page thesis line + README + demo-ready flow.

## 11. Risks & mitigations

- **External usability evidence is still pending:** run a real dyslexia-user session and document only feedback actually received.
- **AI fabricates on thin input:** mitigate with the low-context path + defensive JSON parse + safe fallback.
- **Over-building for 10% technical while under-serving 80% impact/innovation/usability:** hold scope to the non-goals.
- **Extension mobile confusion:** never claim mobile; document desktop-only.
