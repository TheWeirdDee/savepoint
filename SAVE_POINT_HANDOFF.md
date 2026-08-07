# SAVE POINT — Agent Build Handoff

You are building a complete, working web app + Chrome extension called **Save Point** for a hackathon submission. Build it from an empty directory to a finished, demo-ready state, autonomously, in phases. The person you are building for is unwell and light-sensitive and cannot supervise continuously. Do as much as possible without them. Every time something genuinely requires their account, key, or physical action, do NOT stop — record it in the **Manual Steps Register** (Section 12) and keep going.

Two files travel with this prompt and you must maintain both as you work:
- `SAVE_POINT_CHECKLIST.md` — tick every item the moment it is true. Never tick ahead.
- `BUILD_REPORT.md` — you create this at the very end (Section 13): everything done, everything not done, every gap, every manual step.

---

## 0. Absolute rules (violating any of these fails the build)

1. **No git.** Do not run `git init`, `git add`, `git commit`, or any git command. Ever. The person commits manually.
2. **Webpack, never Turbopack.** All Next scripts use `--webpack`. Turbopack has no working native binary in the target environment.
3. **Free AI only.** Reconstruction runs on **Google Gemini `gemini-2.0-flash` (free tier)**. Do NOT use any paid API. The Gemini free tier requires only a free API key (a manual step for the person).
4. **Paste-ready, no placeholders.** Every file you write is complete and runnable. No `// TODO fill this in`, no `...`, no stub bodies. If you cannot complete something, it goes in the Manual Steps Register with an exact instruction — it does not go in the code as a stub.
5. **Prefer complete file rewrites over patches.** When changing a file, rewrite it whole.
6. **Self-audit with quoted evidence.** At the end of every phase you run the phase's audit gate (Section 11): for each requirement, quote the exact line(s) of code or config that satisfy it. No quote = not done = do not tick it.
7. **Low-glare by default.** The person is light-sensitive. The app's default theme is warm, low-saturation, no pure white, no harsh contrast, no flashing. This is also the product's core accessibility requirement — see Section 7.
8. **Never claim something works that you have not verified.** "Builds" means `npm run build` exited 0. "Types clean" means `tsc --noEmit` exited 0.

---

## 1. What Save Point is (the product)

**One sentence:** Most tools restore your *files*. Save Point restores where your *thinking* left off.

Save Point is an AI re-entry tool for neurodivergent (often ADHD) K–12 students. A student working on a school assignment hits **one button to save their cognitive state**. Later they hit **Restore** and get back not their files but their *thinking*, reconstructed by AI into: their goal, where they stopped, what they'd already decided, and the single next physical action to resume. A companion Chrome extension lets them save that state from anywhere on the web (desktop only).

**The problem it solves:** Existing tools (browser tab managers, note apps, IDE session restore, work journals) optimize for *storing information*. None were built around *restoring cognitive context* after an interruption. When an ADHD student is interrupted mid-work, they don't lose their files — they lose *why they were reading this, which idea they'd ruled out, which of five threads was the main one, what they were about to type next*. Save Point captures and restores exactly that.

**The strengths-based frame (important — do not deviate):** The tool does NOT try to fix the student's attention or reduce interruptions. It makes interruption *cheap*, protecting deep focus. It treats the student's way of thinking as the thing worth preserving, not a deficit to correct. Never use deficit/shame language anywhere in the product ("you got distracted", "you've been away 2 hours", streak-guilt). Never reference elapsed time.

**The one AI job that matters (this is not a chatbot):** fuse *incomplete* signals (an optional note + document + selected text + active tab + open tabs) into the cognitive state most useful for re-entry, tagging each inference with a confidence *tier* that controls how it speaks, and — critically — refusing to fabricate: when signal is thin it asks one orienting question instead of inventing a confident, wrong story about the student's own mind.

---

## 2. PRD (Product Requirements)

### 2.1 Target user
Neurodivergent (primarily ADHD) K–12 students doing schoolwork: researching, writing essays, reading, solving problems, preparing presentations. Designed from the lived experience of an ADHD builder; the design intent is K–12 learning.

### 2.2 Core user stories
1. As a student mid-assignment, I can save my cognitive state in **one tap**, optionally adding one short note (typed or dictated), so saving never interrupts my flow.
2. As a student returning later, I'm quietly offered a restore — I'm never force-fed a wall of information.
3. As a student who clicked Restore, I see **one next physical action first**, then where I was, then a gentle confirmation of anything uncertain, with everything else collapsed.
4. As a student, when the tool is unsure, it **asks me a question** instead of pretending — and I can correct it.
5. As a student working across many browser tabs on a laptop, I can save from **any web page** via the extension, and restore back in the calm workspace.
6. As a neurodivergent user, I can adjust the interface (dyslexia-friendly font, larger text, reduced motion) and it never overwhelms me.

### 2.3 Functional requirements
- FR1: Create a save point from the workspace (note + document/tab context).
- FR2: Create a save point from the extension (note + active tab + selected text + page snippet + open-tab titles).
- FR3: Persist save points so they survive closing the browser and returning later.
- FR4: Reconstruct a save point into a structured cognitive-state object via Gemini Flash.
- FR5: Cache the reconstruction on the record; mark the point restored.
- FR6: On workspace load, if an unrestored save point exists, offer restore (one calm line — pull, not push).
- FR7: Restore screen renders next-action-first, confidence-tiered voice, collapsed secondary detail.
- FR8: User can confirm/correct an uncertain decision ("Was it B?" → Yes / No, it was A).
- FR9: Low-context path: when signal is thin, ask one orienting question rather than fabricate.
- FR10: Accessibility controls: font (Atkinson Hyperlegible ↔ Lexend "dyslexia mode"), text size, reduced motion, all persisted locally.
- FR11: A public landing page that explains the product and its thesis.

### 2.4 Non-goals (explicitly OUT — do not build)
Collaboration, teacher dashboards, automatic interruption detection, continuous/passive monitoring, browser-history reading, full rich-text editor, calendar/reminders, gamification, cross-device sync beyond the database, user auth/accounts (use an anonymous device id). One user, one document at a time, manual save points.

### 2.5 Success = judged well on this rubric (build toward these weights)
- Impact on neurodivergent youth — 30%
- Innovation in AI application — 25%
- Usability & accessibility — 25%
- Technical execution — 10%
- Presentation quality — 10%

---

## 3. Tech stack (fixed)

- **Next.js latest, App Router, TypeScript, `src/` dir, Tailwind CSS.** Bundler: **webpack** (scripts use `--webpack`).
- **Supabase** (`@supabase/supabase-js`) for persistence — server-side service-role client only, initialized lazily.
- **Google Gemini** via `@google/generative-ai`, model `gemini-2.0-flash`, **free tier**, for reconstruction. Server-side, lazily initialized.
- **Chrome Extension, Manifest V3** — vanilla HTML/CSS/JS, no build step, posts to the same API as the workspace.
- Fonts via `next/font/google`: **Atkinson Hyperlegible** (default) and **Lexend** (dyslexia mode).

### 3.1 Create the app (Phase 0)
Run:
```
npx create-next-app@latest save-point --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm
cd save-point
```
If the scaffolder enables Turbopack in `package.json` scripts, **edit the scripts** so `dev` and `build` use `--webpack`:
```json
"scripts": {
  "dev": "next dev --webpack",
  "build": "next build --webpack",
  "start": "next start"
}
```
Then install runtime deps:
```
npm install @supabase/supabase-js @google/generative-ai
```

---

## 4. Architecture

```
        Workspace (Next.js)  ─────────────┐
                                          │  POST /api/save-points  (create)
        Chrome Extension (MV3) ───────────┤  GET  /api/save-points  (list + latest unrestored)
                                          │  POST /api/reconstruct  (reconstruct one point)
                                          │  PATCH /api/save-points (record correction / restored)
                                          ▼
                                     Supabase (save_points table)
                                          │
                                          ▼
                            Gemini Flash reconstruction (server)
                                          │
                     ┌────────────────────┼────────────────────┐
                     ▼                    ▼                    ▼
                 cognitive state     next action          confidence tiers
                                          │
                                          ▼
                    Restore screen (next action first → context → gentle Q → More)
```

**Shared schema is law.** The workspace and the extension send the **same** capture payload shape so the extension can never become a second product.

### 4.1 Directory layout to produce
```
save-point/
  README.md
  .env.example
  package.json
  next.config.js            # webpack; no turbopack
  tsconfig.json
  tailwind.config.ts
  postcss.config.js
  supabase/
    schema.sql
  src/
    app/
      layout.tsx            # fonts, providers, base theme
      globals.css           # design tokens (CSS variables)
      page.tsx              # LANDING PAGE (public)
      workspace/
        page.tsx            # the workspace (renders the client Workspace component)
      api/
        save-points/route.ts
        reconstruct/route.ts
    components/
      Workspace.tsx         # client: doc area + save button + list + restore
      SavePointButton.tsx
      SavePointList.tsx
      RestoreOffer.tsx      # on-load calm "restore where you were?"
      RestoreCard.tsx       # next action first, collapsed detail
      ConfidenceLine.tsx    # renders a field in the right voice for its tier
      MoreContext.tsx       # collapsed secondary detail
      AccessibilityBar.tsx  # font / size / reduced-motion, persisted
      ConnectExtension.tsx  # shows how to load the extension + device id
    lib/
      types.ts              # the shared schema (below)
      client.ts             # device-id + fetch helpers (client-side)
      supabase.ts           # lazy server client
      gemini.ts             # lazy server client + model constant
      reconstruct.ts        # calls Gemini, parses strict JSON
      reconstruct-prompt.ts # the system prompt + user-message builder
      map.ts                # DB row <-> SavePoint mapping
  extension/
    manifest.json
    popup.html
    popup.css
    popup.js
    options.html            # set API base URL + device id
    options.js
```

---

## 5. Data contracts (must match exactly across app, extension, DB, AI)

`src/lib/types.ts`:
```ts
export type CaptureSource = "workspace" | "extension";

export type SavePointCapture = {
  source: CaptureSource;
  userNote?: string;                 // optional, typed OR dictated — never required
  activeContext: {
    title?: string;
    url?: string;
    selectedText?: string;
    visibleTextSnippet?: string;
  };
  openTabs?: Array<{ title: string; url: string }>;
  workspaceContext?: {
    documentTitle?: string;
    documentContent?: string;
    recentEdits?: string;
  };
};

// Confidence is a TIER, not a float. Tier -> speech register:
//   high   -> statement  ("You had chosen Source B.")
//   medium -> hedge      ("It looks like you were leaning toward Source B.")
//   low    -> question   ("Were you comparing Source A and Source B?")
export type Confidence = "high" | "medium" | "low";

export type ReconstructedState = {
  objective: { text: string; confidence: Confidence };
  stoppingPoint: { text: string; confidence: Confidence };
  mainThread: { text: string; confidence: Confidence };
  decisions: Array<{ text: string; confidence: Confidence; needsConfirmation: boolean }>;
  openThreads: Array<{ text: string; relevance: "primary" | "supporting" | "uncertain" }>;
  nextAction: { text: string; confidence: Confidence };
  lowContext: boolean;               // true -> honest orienting-question mode
  orientingQuestion: string;         // filled only when lowContext is true
};

export type SavePoint = {
  id: string;
  deviceId: string;
  source: CaptureSource;
  userNote: string | null;
  activeContext: SavePointCapture["activeContext"];
  openTabs: NonNullable<SavePointCapture["openTabs"]>;
  workspaceContext: NonNullable<SavePointCapture["workspaceContext"]>;
  reconstruction: ReconstructedState | null;
  restored: boolean;
  restoredAt: string | null;
  createdAt: string;
};
```

**Capture scope limit (never exceed):** active tab title/URL, selected text, a short page snippet, optional other-tab titles, the optional note. NO full browser history, keystrokes, continuous screen capture, or full page content. The extension is a save trigger, not surveillance.

### 5.1 Supabase schema (`supabase/schema.sql`)
```sql
create extension if not exists "pgcrypto";

create table if not exists save_points (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  source text not null check (source in ('workspace','extension')),
  user_note text,
  active_context jsonb not null default '{}'::jsonb,
  open_tabs jsonb not null default '[]'::jsonb,
  workspace_context jsonb not null default '{}'::jsonb,
  reconstruction jsonb,
  restored boolean not null default false,
  restored_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists save_points_device_created_idx
  on save_points (device_id, created_at desc);
```
(Demo scope: no row-level security, no auth. Access is only via server routes holding the service-role key. Note this clearly in the README.)

---

## 6. The AI reconstruction (the 25% Innovation criterion)

### 6.1 System prompt (`src/lib/reconstruct-prompt.ts`)
The prompt must instruct the model to:
- Reconstruct **cognitive state for re-entry**, NOT summarize the document.
- Reason from sparse input; never pad thin evidence into a confident story.
- Return **only** a single JSON object, no prose, no code fences.
- Assign a confidence **tier** (`high|medium|low`) per field, honestly; tier controls wording (statement / hedge / question).
- **Never invent a decision and present it as fact.** Uncertain decisions get `needsConfirmation: true` and lower confidence.
- `nextAction` = ONE concrete, physical, immediately-doable step ("Write two sentences on why Source B is more reliable"), never vague ("continue the report").
- **Low-context path:** if the snapshot is too thin, set `lowContext: true` and put one warm orienting question in `orientingQuestion`; still fill other fields at low confidence without fabricating.
- Tone: warm, plain, second person, short sentences; no time references; no shame.
- Emit exactly the `ReconstructedState` JSON shape.

The user-message builder assembles only the present signals (note, document title/content truncated to ~6000 chars, recent edits ~1500, active page, selected text ~1200, page snippet ~1500, up to 15 open-tab titles). Missing fields are simply omitted (or labelled "(none left)" for the note).

### 6.2 Gemini call (`src/lib/gemini.ts` + `src/lib/reconstruct.ts`)
- `gemini.ts`: lazy `getGemini()` reading `GOOGLE_API_KEY`; throw only if actually called without a key. `export const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";`
- Use `@google/generative-ai`, set `generationConfig: { responseMimeType: "application/json" }` so the model returns clean JSON.
- Parse defensively: strip any stray code fences, `JSON.parse`, and validate the shape (tiers are one of the three enums; arrays exist; `lowContext` boolean). On parse failure, return a safe low-context fallback object (never crash the request, never fabricate).

---

## 7. ND-first design system (the 25% Usability criterion — build it, don't just list it)

Encode these as CSS variables in `globals.css` and honor them everywhere.

**Palette (low-glare, calm; no pure white, no default AI cream/terracotta):**
- `--paper` warm off-white background `#F7F6F2`
- `--ink` soft near-black text `#2A2E2D` (never pure `#000` on `--paper`)
- `--ink-soft` muted secondary text `#5C625F`
- `--mist` collapsed/secondary surface `#ECEAE3`
- `--line` hairline borders `#DAD7CE`
- `--sage` calm primary accent (focus/harbor) `#3A6B63`
- `--marker` the single signature accent, the "save-point marker", used sparingly `#C8823C`
- `--ask` gentle uncertainty tone (NOT red) periwinkle `#6B72A6`

**Type:** Atkinson Hyperlegible default (legibility-first — the typeface *is* the accessibility statement); Lexend for dyslexia mode. Base size ≥ 18px, line-height ≥ 1.6, reading width ≤ 640px, left-aligned (never justified).

**Behaviour rules (non-negotiable):**
- One primary action per screen. Restore leads with ONE next action, big; everything else collapsed under "More context".
- Progressive disclosure everywhere; never render the full tab list / full tree by default.
- Save is one action; the note is optional, dictatable, never a required form; no "are you sure" modal.
- Restore artifact: second person, plain language, short sentences; confidence shown gently (`--ask`, phrased as a question), never a scary flag.
- No notification badges, no red dots, no infinite scroll, no auto-playing motion.
- Respect `prefers-reduced-motion`; provide an in-app reduced-motion toggle too. All motion subtle and optional.
- The "save-point marker" (a small circular checkpoint glyph) is the one signature element; keep everything else quiet.
- Every text input has a dictation affordance (Web Speech API where available; degrade gracefully).
- Full keyboard navigation; visible focus rings; ARIA labels; screen-reader friendly.

**Signature moment:** on save, a single gentle pulse of the marker glyph (skipped under reduced motion). One bold moment; nothing else animates.

---

## 8. The landing page (`src/app/page.tsx`) — required (FR11, Presentation 10%)

A public, calm, single-column page using the same design system. It must:
- Open with the thesis as the hero: **"Most tools restore your files. Save Point restores where your thinking left off."**
- One short paragraph naming the real problem (losing cognitive context after an interruption) in the strengths frame (protect focus, don't fix the person).
- A 3-step "how it works": Save your state (one tap) → Get interrupted, leave → Restore your thinking, not your tabs.
- Name the audience honestly: designed for neurodivergent K–12 students, built from lived ADHD experience.
- One clear primary action: **"Open the workspace" → /workspace**.
- Quiet mention that when the tool is unsure, it asks instead of inventing.
- No marketing fluff, no fake testimonials, no stock-photo vibe. Plain, warm, confident. Low-glare. Fully responsive to mobile.

Write the copy yourself in the product's voice (plain verbs, sentence case, active voice, name things by what the user controls).

---

## 9. The Chrome extension (desktop only — do not claim mobile)

MV3, no build step. Three popup states only: **Ready** ("Save where my brain is") → optional one-line note → **Saved** ("Save point created — return from the Save Point workspace"). No dashboard, no AI output, no history in the popup; restore happens in the calm workspace. `options.html/js` lets the person set the API base URL and shows/sets the device id (so extension saves land in the same account as the workspace). Capture only the fields allowed in Section 5. Post to `POST /api/save-points` with the shared payload.

---

## 10. Phased build plan (do in order; run the audit gate at the end of each phase; tick the checklist)

**Phase 0 — Scaffold.** create-next-app (latest, TS, Tailwind, app, src, alias), force webpack scripts, install `@supabase/supabase-js` and `@google/generative-ai`, create `.env.example`, write `README.md` skeleton. Do NOT run git.

**Phase 1 — Foundations.** `types.ts`, `globals.css` design tokens, `layout.tsx` (fonts + theme + AccessibilityBar mount), `supabase.ts` (lazy), `gemini.ts` (lazy), `map.ts`, `client.ts` (device id in localStorage + fetch helpers), `supabase/schema.sql`. Verify `tsc --noEmit` clean.

**Phase 2 — Save (workspace).** Workspace doc area + `SavePointButton` (one tap, optional dictatable note) → `POST /api/save-points` persists to Supabase. Verify a row is created (person will supply keys later; until then, verify the code path and that build passes — log the runtime-verification step to the Manual Steps Register).

**Phase 3 — Reconstruct.** `reconstruct-prompt.ts`, `reconstruct.ts` (Gemini Flash, JSON mode, defensive parse + low-context fallback), `POST /api/reconstruct` (load row → reconstruct → cache on row → mark restored). Include the low-context path.

**Phase 4 — Restore.** `RestoreCard` (next action first → where you were → gentle confirmation → collapsed `MoreContext`), `ConfidenceLine` (tier→voice), `RestoreOffer` (on workspace load, GET latest unrestored → one calm offer). `SavePointList` for history.

**Phase 5 — Correction + low-context UX.** "Was it B? Yes / No, it was A" writes a correction back (PATCH). Render the orienting-question state distinctly and gently when `lowContext`.

**Phase 6 — Accessibility.** `AccessibilityBar`: font (Atkinson↔Lexend), text size, reduced-motion toggle, persisted to localStorage and applied via a data attribute / CSS variables on `<html>`. Keyboard nav + focus + ARIA pass across the app.

**Phase 7 — Extension.** manifest, popup (3 states), options page, wired to the same API with the shared payload. `ConnectExtension` component in the workspace explains loading it and shows the device id.

**Phase 8 — Landing page + polish.** Build `page.tsx` per Section 8. Final `README.md`. Final low-glare visual pass. Run `npm run build` (webpack) and confirm exit 0. Update the Manual Steps Register and write `BUILD_REPORT.md`.

---

## 11. Audit gates (run at the end of EVERY phase)

For each phase, before ticking its checklist items, produce an audit block in your working notes of this exact form, one row per requirement:

```
[PHASE N AUDIT]
Requirement: <the requirement in one line>
Evidence: <file path>:<line(s)>  ->  "<quoted code/config that satisfies it>"
Verdict: MET | NOT MET | MANUAL (needs person — added to Register item #X)
```

Rules:
- If you cannot quote a concrete line, the verdict is NOT MET — fix it, don't tick it.
- `tsc --noEmit` must be clean before any phase is ticked complete.
- After Phase 8, `npm run build` must exit 0 (with the person's fonts reachable; if the build environment blocks Google Fonts, note it as a known environment caveat, not a code defect).
- Never tick a checklist box whose audit verdict is NOT MET.

---

## 12. Manual Steps Register (you maintain this; it also goes into BUILD_REPORT)

Keep a running numbered list of everything the person must do that you cannot. Do not stop building when you hit one — record it and continue. At minimum this will include:

1. Create a free Supabase project; copy `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into `.env.local`.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Create a **free** Google Gemini API key (aistudio.google.com) and set `GOOGLE_API_KEY` in `.env.local`.
4. `npm install` then `npm run dev`; open `/` (landing) and `/workspace`.
5. Load the extension: `chrome://extensions` → Developer mode → Load unpacked → `extension/`; set the API base URL + device id in its options.
6. End-to-end runtime verification (save → reconstruct → restore) once keys are in place.
7. Record the 3-minute demo video; write the Devpost description; make the GitHub repo public.
8. Run the neurodivergent-tester session (dyslexic tester) and record one quote + one design change.
9. Any commit/push (you never touch git).

Add any others you discover. For each, write the exact command or click-path.

---

## 13. Final deliverable: `BUILD_REPORT.md` (create at the very end)

An honest, extensive report containing:
- **Summary:** what Save Point is, and one line on final build status (`npm run build` result, `tsc` result).
- **Done:** every phase and feature completed, each with a one-line evidence pointer (file:line or file).
- **Not done / deferred:** anything from the plan you did not complete, and why.
- **Gaps & risks:** anything fragile, any assumption you made, any place the person should double-check.
- **Manual Steps Register:** the full numbered list from Section 12 with exact instructions.
- **Rubric mapping:** one short line per rubric criterion (Impact 30 / Innovation 25 / Usability 25 / Technical 10 / Presentation 10) pointing to where the app addresses it.
- **How to run:** the exact sequence from empty checkout to running app.
- **What's intentionally OUT:** restate the non-goals so the person can defend scope to judges.

Do not overstate. If something is untested because it needs the person's keys, say "implemented, not yet runtime-verified" — do not say "working".

---

## 14. Working style (the person's standing preferences)

- Terse, direct, no cheerleading. Commit to decisions; don't bounce choices back.
- Paste-ready, complete files, no placeholders, no stubs.
- Complete file rewrites over patches.
- Fill `SAVE_POINT_CHECKLIST.md` continuously as you work; never tick ahead of evidence.
- Do not caution about time/scheduling/feasibility — just build.
- Never run git. End by producing `BUILD_REPORT.md`.

Begin at Phase 0. Work straight through to Phase 8, maintaining the checklist and the Manual Steps Register the whole way, and finish with `BUILD_REPORT.md`.
