# Save Point — 8-Phase Build Plan

Build in order. At the end of every phase, run the **exit gate** (quote code/config evidence per requirement) before ticking the checklist. `tsc --noEmit` must be clean to close any phase. No git operations at any point.

---

## Phase 0 — Scaffold
**Objective:** empty folder → running Next.js skeleton on webpack.
**Tasks:**
- `npx create-next-app@latest save-point --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm`
- Force webpack scripts: `dev: "next dev --webpack"`, `build: "next build --webpack"`, `start: "next start"`.
- `npm install @supabase/supabase-js @google/generative-ai`
- Create `.env.example` (Supabase URL, service-role key, `GOOGLE_API_KEY`, optional `GEMINI_MODEL`).
- `README.md` skeleton.
**Deliverables:** scaffolded app, deps installed, env template.
**Exit gate:** package.json scripts show `--webpack`; deps present; `tsc --noEmit` clean; no git run.

## Phase 1 — Foundations
**Objective:** shared schema, design tokens, lazy clients, DB schema.
**Depends on:** Phase 0.
**Tasks:** `types.ts` (exact shared schema); `globals.css` (all design tokens); `layout.tsx` (Atkinson + Lexend fonts, theme, mount `AccessibilityBar`); `supabase.ts` (lazy `getSupabaseAdmin`); `gemini.ts` (lazy `getGemini` + `MODEL`); `map.ts`; `client.ts` (device id + fetch helpers); `supabase/schema.sql`.
**Deliverables:** compiling foundation with no runtime behavior yet.
**Exit gate:** tokens present (paper/ink/ink-soft/mist/line/sage/marker/ask); clients lazy (no import-time throw); `tsc --noEmit` clean.

## Phase 2 — Save (workspace)
**Objective:** one-tap save persists to Supabase.
**Depends on:** Phase 1.
**Tasks:** Workspace doc area (title + content); `SavePointButton` (one tap, optional dictatable note, no confirm modal); `POST /api/save-points` (validate, insert via lazy client, `force-dynamic` + `runtime=nodejs`); shared `SavePointCapture` payload; respect capture-scope limits.
**Deliverables:** a save creates a row.
**Exit gate:** save path audited; route flags present; `tsc --noEmit` clean. Runtime insert = MANUAL (needs keys) → Register.

## Phase 3 — Reconstruct (AI)
**Objective:** turn a saved packet into structured cognitive state.
**Depends on:** Phase 2.
**Tasks:** `reconstruct-prompt.ts` (no-summarize, no-fabrication, tier→voice, one physical next action, low-context path, no time/shame, exact JSON shape) + user-message builder (present signals only, truncated); `reconstruct.ts` (Gemini JSON mode, defensive parse, safe low-context fallback); `POST /api/reconstruct` (load → reconstruct → cache on row → mark restored).
**Deliverables:** reconstruction endpoint returning valid `ReconstructedState`.
**Exit gate:** prompt contains all required rules; parser validates + falls back safely; `tsc --noEmit` clean. Runtime AI call = MANUAL (needs key) → Register.

## Phase 4 — Restore
**Objective:** the calm re-entry experience.
**Depends on:** Phase 3.
**Tasks:** `RestoreCard` (next action first → where you were → gentle confirmation → collapsed `MoreContext`); `ConfidenceLine` (high=statement, medium=hedge, low=question); `RestoreOffer` (on load, GET latest unrestored → one calm line, pull not push); `SavePointList` (history, no badges/dots).
**Deliverables:** full save→restore loop in the UI.
**Exit gate:** next action renders first and largest; secondary detail collapsed; offer is a single calm line; `tsc --noEmit` clean.

## Phase 5 — Correction + low-context UX
**Objective:** honesty made interactive.
**Depends on:** Phase 4.
**Tasks:** uncertain decision shows "Was it B? [Yes] [No, it was A]" → `PATCH` writes correction → UI updates; `lowContext` renders the single orienting question gently (uses `--ask`, not red, not a scary flag), still leading with a small next action, never a fabricated decision.
**Deliverables:** correction flow + low-context screen.
**Exit gate:** correction persists and re-renders; low-context path visible and gentle; `tsc --noEmit` clean.

## Phase 6 — Accessibility
**Objective:** the 25% usability criterion, actually implemented.
**Depends on:** Phase 4.
**Tasks:** `AccessibilityBar` — font toggle (Atkinson↔Lexend), text size, reduced-motion toggle; persist to `localStorage`, apply via `<html>` data attribute / CSS vars; enforce base ≥18px, line-height ≥1.6, width ≤640px, left-aligned; full keyboard nav, visible focus, ARIA labels; all motion subtle/optional; marker pulse skipped under reduced motion; no time/shame language anywhere.
**Deliverables:** working, persisted accessibility controls across the app.
**Exit gate:** each control works and persists; keyboard/ARIA pass; `tsc --noEmit` clean.

## Phase 7 — Extension (desktop only)
**Objective:** the desktop sensor on the same API.
**Depends on:** Phase 2 (API).
**Tasks:** `manifest.json` (MV3, minimal permissions); popup (three states only); `options.html/js` (API base URL + device id); capture only allowed fields; post shared payload to `POST /api/save-points`; `ConnectExtension` in workspace (load help + device id). Never claim mobile.
**Deliverables:** loadable unpacked extension that creates save points.
**Exit gate:** popup states correct; payload matches schema; options set base URL + device id; `tsc --noEmit` clean.

## Phase 8 — Landing page + polish
**Objective:** demo-ready, presentable, building clean.
**Depends on:** all prior.
**Tasks:** `page.tsx` landing per LANDING_PAGE.md (thesis hero, problem in strengths frame, 3-step how-it-works, honest audience, one CTA → `/workspace`, "asks when unsure", responsive, low-glare); final `README.md`; final low-glare visual pass; `npm run build` (webpack) exits 0; finalize Manual Steps Register; write `BUILD_REPORT.md`.
**Deliverables:** finished app + landing + report.
**Exit gate:** build exits 0 (note Google-Fonts network caveat if the build env blocks fetch — that's environmental, not a code defect); `BUILD_REPORT.md` written with done / not-done / gaps / manual steps / rubric mapping / run instructions.

---

## Global exit criteria (all must hold at the end)
- No git command ever run.
- No paid API; reconstruction on free Gemini Flash.
- No placeholders/stubs/TODOs in shipped files.
- One shared capture schema across workspace + extension.
- Supabase + Gemini clients lazy; both routes `force-dynamic` + `runtime=nodejs`.
- `tsc --noEmit` clean and `npm run build` exit 0.
