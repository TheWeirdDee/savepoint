# SAVE POINT — Build Checklist

Tick each box `[x]` the moment it is true and audit-verified. `[~]` = in progress, `[!]` = blocked/manual (added to Manual Steps Register).

---

## Phase 0 — Scaffold
- [x] `create-next-app`-equivalent scaffold: TypeScript, Tailwind, App Router, `src/` dir, import alias `@/*` (hand-built to avoid interactive prompts on a non-empty dir; identical output — see `package.json`, `tsconfig.json`)
- [x] `package.json` scripts use **webpack** (`next dev --webpack`, `next build --webpack`); no Turbopack anywhere — `package.json`: `"dev": "next dev --webpack"`, `"build": "next build --webpack"`
- [x] `@supabase/supabase-js` installed — `package.json` dependencies
- [x] `@google/generative-ai` installed — `package.json` dependencies
- [x] `.env.example` created with all keys (Supabase URL, Supabase service role, `GOOGLE_API_KEY`, optional `GEMINI_MODEL`)
- [x] `README.md` complete (setup, env, schema, run, extension, deploy)
- [x] No git commands were run
- [x] `tsc --noEmit` clean (verified: exit 0)

## Phase 1 — Foundations
- [x] `src/lib/types.ts` matches the shared schema exactly (CaptureSource, SavePointCapture, Confidence tier, ReconstructedState, SavePoint)
- [x] `src/app/globals.css` defines all design tokens (paper, ink, ink-soft, mist, line, sage, marker, ask)
- [x] Background is warm off-white (no pure white); text is soft near-black (no pure black on paper) — `globals.css`: `--paper: #f7f6f2;` / `--ink: #2a2e2d;`
- [x] `src/app/layout.tsx` loads Atkinson Hyperlegible (default) + Lexend (dyslexia mode) via `next/font/google`
- [x] `AccessibilityBar` mounted in layout — `layout.tsx`: `<AccessibilityBar />` inside `<body>`
- [x] `src/lib/supabase.ts` lazy `getSupabaseAdmin()` (no throw at import time)
- [x] `src/lib/gemini.ts` lazy `getGemini()` + `MODEL = gemini-2.0-flash` (override via env)
- [x] `src/lib/map.ts` DB row ↔ SavePoint mapping
- [x] `src/lib/client.ts` device-id (localStorage) + fetch helpers
- [x] `supabase/schema.sql` matches Section 5.1
- [x] `tsc --noEmit` clean

## Phase 2 — Save (workspace)
- [x] Workspace has a document area (title + content) a student can type in — `Workspace.tsx` title input + textarea
- [x] `SavePointButton` saves in **one tap**
- [x] Optional note field: not required, dictatable (Web Speech API, graceful degrade) — `SavePointButton.tsx` `dictationSupported()` + `toggleDictation()`
- [x] No "are you sure" modal; save is instant and forgiving
- [x] `POST /api/save-points` validates input and inserts a row via lazy Supabase client
- [x] `POST` route marked `force-dynamic`, `runtime = nodejs` — `route.ts`: `export const dynamic = "force-dynamic"; export const runtime = "nodejs";`
- [x] Shared `SavePointCapture` payload used (no bespoke shape)
- [x] Capture scope respected (no history/keystrokes/full-page/continuous capture)
- [x] `tsc --noEmit` clean; save code path audited
- [!] runtime insert verified once keys exist → Register #1, #2, #6

## Phase 3 — Reconstruct (AI)
- [x] `reconstruct-prompt.ts` system prompt: reconstruct cognitive state (not summarize); no fabrication; tier→voice; one physical next action; low-context path; no time/shame language; exact JSON shape
- [x] User-message builder omits missing signals; truncates per limits (doc ~6000, edits ~1500, selected ~1200, snippet ~1500, ≤15 tabs)
- [x] `reconstruct.ts` calls Gemini Flash with `responseMimeType: "application/json"` — `gemini.ts`: `generationConfig: { responseMimeType: "application/json" }`
- [x] Defensive JSON parse: strips fences, validates tiers/arrays/lowContext, safe low-context fallback on failure (never crash, never fabricate) — `reconstruct.ts`: `extractJson()` + `lowContextFallback()`
- [x] `POST /api/reconstruct`: load row → reconstruct → cache reconstruction on row → mark restored
- [x] Route `force-dynamic`, `runtime = nodejs`
- [x] `tsc --noEmit` clean
- [!] runtime reconstruction verified with a real key → Register #3, #6

## Phase 4 — Restore
- [x] `RestoreCard` renders **next action first**, big and unmistakable — `RestoreCard.tsx`: "Your next step" section, `text-2xl ... sm:text-3xl`
- [x] Then "where you were" (objective / stopping point / main thread) in plain second person
- [x] Then a gentle confirmation for any uncertain decision
- [x] Everything else collapsed under **"More context"** (open threads, tabs, note, full reconstruction) — `MoreContext.tsx`
- [x] `ConfidenceLine` renders each field in the correct voice: high=statement (sage), medium=hedge (marker), low=question (ask)
- [x] `RestoreOffer`: on workspace load, GET latest unrestored → **one calm line** offering restore (pull, not push)
- [x] No wall of tabs/info shown on return
- [x] `SavePointList` shows history without badges/red-dots
- [x] `tsc --noEmit` clean

## Phase 5 — Correction + low-context UX
- [x] Uncertain decision shows "Was it B? [Yes] [No, it was A]" — `RestoreCard.tsx` `Confirm()` component
- [x] Correction writes back (PATCH) and updates the displayed state — `client.ts` `correctDecision()` → `PATCH /api/save-points`
- [x] `lowContext` state renders the single orienting question, gently (uses `--ask`, not red, not a scary flag) — `RestoreCard.tsx` `LowContextCard`: `text-ask`
- [x] Low-context screen still leads with a small next action, never a fabricated decision
- [x] `tsc --noEmit` clean

## Phase 6 — Accessibility
- [x] Font toggle: Atkinson Hyperlegible ↔ Lexend (dyslexia mode) — `AccessibilityBar.tsx` `Toggle` "Dyslexia-friendly font"
- [x] Text-size control — `AccessibilityBar.tsx` `Group label="Text size"` (A / A+ / A++)
- [x] Reduced-motion toggle (in addition to honoring `prefers-reduced-motion`) — `AccessibilityBar.tsx` "Reduce motion" + `globals.css` `@media (prefers-reduced-motion: reduce)`
- [x] Preferences persisted to localStorage and applied on load — `AccessibilityBar.tsx` `localStorage.setItem(KEY, ...)`; `layout.tsx` `prefScript` applies pre-paint
- [x] Base size ≥18px, line-height ≥1.6, reading width ≤640px, left-aligned (never justified) — `globals.css`: `font-size: 18px;` / `line-height: 1.65;`; `tailwind.config.ts`: `maxWidth.reading = "40rem"` (640px)
- [x] Full keyboard navigation; visible focus rings — `globals.css`: `:focus-visible { outline: 3px solid var(--sage); ... }`
- [x] ARIA labels on controls; screen-reader sensible — `aria-expanded`, `aria-pressed`, `aria-label`, `role="status"`, `role="region"` across components
- [x] All motion subtle/optional; save-point marker pulse skipped under reduced motion — `.animate-marker-pulse` suppressed by `@media (prefers-reduced-motion: reduce)` and `.motion-off`
- [x] No time-elapsed language anywhere; no shame/deficit language anywhere
- [x] `tsc --noEmit` clean

## Phase 7 — Extension (desktop only)
- [x] `manifest.json` MV3, minimal permissions (activeTab/tabs/scripting/storage only)
- [x] Popup: three states only (Ready → optional note → Saved), plus needs-setup/error states for graceful degrade
- [x] No dashboard / AI output / history inside the popup
- [x] Captures only allowed fields (active tab title/URL, selected text, page snippet, open-tab titles, optional note) — `popup.js` `collectFromPage()` / `captureActiveContext()`
- [x] Posts the shared `SavePointCapture` payload to `POST /api/save-points`
- [x] `options.html/js`: set API base URL + device id (matches workspace account)
- [x] `ConnectExtension` component in workspace explains loading + shows device id
- [x] Nowhere claims the extension works on mobile — README + `ConnectExtension.tsx` label "(desktop only)"

## Phase 8 — Landing page + polish
- [x] `src/app/page.tsx` hero = the thesis line — `page.tsx`: "Most tools restore your files. / Save Point restores where your thinking left off."
- [x] Problem paragraph in strengths frame (protect focus, not fix the person)
- [x] 3-step "how it works" (save → leave → restore your thinking)
- [x] Audience named honestly (ND K–12; built from lived ADHD experience)
- [x] One primary action → `/workspace`
- [x] Mentions "when unsure, it asks instead of inventing"
- [x] No fake testimonials / stock-photo vibe; plain, warm, low-glare; responsive to mobile (`.wrap` container, grid columns collapse to 1 under `md`/`lg` breakpoints)
- [x] Final `README.md` complete (setup, env, schema, run, load extension)
- [x] Final low-glare visual pass across all screens
- [x] `npm run build` (webpack) exits 0 — verified: `✓ Compiled successfully`, routes generated
- [x] Manual Steps Register finalized
- [x] `BUILD_REPORT.md` written

## FIX PASS — frontend/layout corrections (see BUILD_REPORT.md "FIX PASS" section for full evidence)
- [x] **Fix 1 (centering bug):** `max-w-reading` removed from `Workspace.tsx` and `page.tsx` top-level wrappers (verified: `grep -rn "max-w-reading" src` → no matches); replaced with `.wrap` (1120px, `margin:0 auto`, equal `padding-left`/`padding-right`) — `globals.css:73`
- [x] **Fix 1 (tokens):** new tokens added without removing the original 8 — `tailwind.config.ts`: `paper-2`, `forest`, `forest-2`, `bone`, `bone-soft`, `sage-bright`, `marker-soft`, `line-dark`; Space Mono added via `next/font/google` in `layout.tsx`
- [x] **Fix 2 (landing rebuild):** all 10 sections present in order — sticky nav, hero + restore-card mock, dark "shift" band, problem, how-it-works, features grid, dark "who" band, FAQ accordion, CTA band, footer — `src/app/page.tsx`
- [x] **Fix 3 (workspace dashboard):** two-pane grid — `Workspace.tsx:94`: `grid grid-cols-1 items-start gap-8 lg:grid-cols-[280px_1fr]`; rail has New-save-point button, `SavePointList`, inline `AccessibilityBar`, `ConnectExtension`; main pane holds the restore offer banner, writing area, or `RestoreCard`
- [x] **Fix 3 (read-width scoping):** `max-w-read` (40rem) applied only to `RestoreCard`'s `<article>` (both the normal and low-context variants) and to docs/landing prose blocks — never to a full-page wrapper — `RestoreCard.tsx:34`, `RestoreCard.tsx:145`
- [x] **Fix 4 (docs routes):** `src/app/docs/page.tsx` created with Quickstart, What is a save point, Loading the extension, Privacy, and FAQ sections (anchored ids); footer/nav links wired to `/docs`, `/docs#quickstart`, `/docs#extension`, `/docs#what-is-a-save-point`, `/docs#privacy`
- [x] `tsc --noEmit` clean after fix pass (verified: exit 0)
- [x] `npm run build --webpack` exits 0 after fix pass — routes generated: `/`, `/docs`, `/workspace` (static), `/api/save-points`, `/api/reconstruct` (dynamic)
- [x] No git command was run during the fix pass

## ACCOUNTS PASS — username/password auth (see BUILD_REPORT.md "ACCOUNTS PASS" section for full evidence)
- [x] `supabase/schema.sql`: `users` table (`email citext unique`, `full_name`, `username citext unique`, `password_hash`) + `save_points` rebuilt with `user_id` ownership, replacing `device_id` entirely
- [x] Passwords hashed, never stored/logged in plain text — `src/lib/auth.ts:34`: `return bcrypt.hash(password, 12);`
- [x] Session = JWT signed with `SESSION_SECRET`, ~30-day expiry, delivered as an httpOnly cookie **and** in the JSON body for the extension — `src/lib/auth.ts` (`signToken`, `SESSION_COOKIE_OPTIONS`)
- [x] `getUserId(req)` resolves identity from the `sp_session` cookie **or** an `Authorization: Bearer` header — `src/lib/auth.ts`
- [x] Server-side validation: email format, username ≥3 chars no spaces, password ≥8 chars; DB-level uniqueness on email/username; login always returns the same generic "Username or password is incorrect." regardless of which was wrong
- [x] `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` — all `force-dynamic` + `runtime="nodejs"`
- [x] `/api/save-points` (POST/GET/PATCH) and `/api/reconstruct` (POST) require `getUserId(req)`; return 401 if absent; all queries scoped to `user_id` — Gemini reconstruction logic itself untouched
- [x] `deviceId`/`device_id` fully removed — verified: `grep -rn "deviceId|device_id" src extension` → no matches
- [x] CORS added to the two routes the extension calls cross-origin (`/api/auth/login`, `/api/save-points`) — verified: `curl -X OPTIONS` on both returns `204` with `access-control-allow-origin: *`
- [x] `/login` and `/signup` pages built (`LoginForm.tsx`, `SignupForm.tsx`) — calm single-card layout, labeled fields, inline error text, redirect to `/workspace` on success
- [x] `/workspace` protected server-side — `workspace/page.tsx`: reads the session cookie via `next/headers`, `redirect("/login")` if absent/invalid
- [x] Workspace header shows `Signed in as {username}` + a working **Log out** control
- [x] Device-id "Connect the extension" panel removed from the workspace, replaced with a one-line "sign in with the same username" note + a `/docs#extension` link
- [x] Landing nav shows **Log in / Sign up** when signed out, **Open the workspace →** when signed in — `src/app/page.tsx` (reads the session cookie server-side)
- [x] Extension `options.html/js`: device-id field removed, single **Workspace address** field defaulting to `http://localhost:3000`
- [x] Extension `popup.js`: no stored token → login form (`POST /api/auth/login`) → stores `token` in `chrome.storage.local`; token present → normal Ready/Saving/Saved flow with `Authorization: Bearer` header; `401` on save clears the token and drops back to login; "Log out" link clears it manually
- [x] `tsc --noEmit` clean (verified: exit 0)
- [x] `npm run build --webpack` exits 0 — routes generated: `/`, `/login`, `/signup`, `/docs`, `/workspace` (dynamic — session-protected), `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/save-points`, `/api/reconstruct`
- [!] Runtime signup/login verified against the live Supabase project → **blocked on Manual Step: re-run `supabase/schema.sql`** (confirmed via a real `POST /api/auth/signup` against the un-migrated DB returning a clean `500`, not a crash)
- [x] No git command was run during the accounts pass

## RESILIENCE + THREADS PASS (see BUILD_REPORT.md "RESILIENCE + THREADS PASS" section for full evidence)
- [x] `reconstruct()` never throws — returns `ReconstructOutcome` (`{ok:true,state}` or `{ok:false,kind,message}`) — `src/lib/reconstruct.ts`
- [x] Classification uses the SDK's typed errors (`GoogleGenerativeAIFetchError.status`, `GoogleGenerativeAIAbortError`), not string-matching — `reconstruct.ts`: `if (err instanceof GoogleGenerativeAIFetchError) { const status = err.status; ... }`
- [x] Four distinct kinds (`quota`/`auth`/`network`/`parse`), each with a specific, actionable message — `FAILURE_MESSAGE` record in `reconstruct.ts`
- [x] 20s timeout on the Gemini call so a doomed request resolves instead of hanging — `reconstruct.ts`: `{ timeout: GEMINI_TIMEOUT_MS }` passed to `generateContent`
- [x] **Integrity rule verified live**: a failed reconstruction is never written to the row or marked restored — `/api/reconstruct/route.ts` only calls `.update({reconstruction: outcome.state, restored: true, ...})` inside the `outcome.ok` branch; confirmed via a real `POST /api/save-points` → `POST /api/reconstruct` (got a live `503`) → `GET /api/save-points` showing `"restored":false` still
- [x] Route returns proper status codes — `route.ts`: `const status = outcome.kind === "quota" || outcome.kind === "network" ? 503 : 500;`
- [x] `GET /api/health/ai` — no live call without `?check=1`, never called automatically anywhere in the app (verified: `grep -rn "health/ai" src` shows no internal callers) — `src/app/api/health/ai/route.ts`
- [x] FailureCard is visually/textually distinct from LowContextCard — different eyebrow color (`text-marker` vs `text-ask`), no orienting question, no fabricated "next step," `RestoreCard.tsx`
- [x] Genuine low-context path unchanged — `LowContextCard` reverted to its pre-this-pass form (no retry button, no failure-mode branching)
- [x] Demo mode off by default, client-side only, never touches the database — `client.ts`: `if (isDemoMode()) { return { ok: true, state: DEMO_RECONSTRUCTED_STATE }; }` returns before any `fetch` call
- [x] `src/lib/demoFixtures.ts` clearly labeled as demo data in a comment, includes a realistic biology-report example with one `primary` and one `supporting` thread
- [x] Exactly one primary thread surfaces on the main restore card — `RestoreCard.tsx`: `reconstruction.openThreads.find((t) => t.relevance === "primary")`; verified deterministically against the demo fixture (2 threads in, 1 primary selected, 1 supporting excluded — output quoted in BUILD_REPORT.md)
- [x] Reconstruct-prompt edit is the only allowed prompt change — `reconstruct-prompt.ts`: `"OPEN THREADS: mark AT MOST ONE thread \"primary\"..."` — meaning/JSON shape otherwise untouched
- [x] `tsc --noEmit` clean; `npm run build --webpack` exits 0 — 12 routes (added `/api/health/ai`)
- [x] No git command was run during this pass

---

## Cross-cutting invariants (must hold at the end)
- [x] No git command was ever run
- [x] No paid API used; reconstruction is on free Gemini Flash (`gemini-2.0-flash`)
- [x] No placeholders/stubs/TODOs left in any shipped file
- [x] One shared capture schema used by both workspace and extension (`src/lib/types.ts` `SavePointCapture`)
- [x] Supabase and Gemini clients both lazy (no import-time throw)
- [x] All API routes (`save-points`, `reconstruct`, `auth/signup`, `auth/login`, `auth/me`, `auth/logout`) `force-dynamic` + `runtime = nodejs`
- [x] `tsc --noEmit` clean and `npm run build` exit 0 (both verified this session)
- [x] Passwords are hashed (bcrypt, cost 12); no plaintext password ever stored or logged
- [x] No anonymous device-id ownership remains anywhere (`grep -rn "deviceId|device_id" src extension` → no matches)

## Rubric coverage (point to where each is addressed)
- [x] Impact 30% — re-entry problem + strengths frame + lived-experience design (PRD.md sections 3–4; landing page "Who it's for")
- [x] Innovation 25% — sparse-signal fusion + confidence tiers + no-fabrication low-context path (`reconstruct-prompt.ts`, `reconstruct.ts`)
- [x] Usability 25% — one-action save, next-action-first restore, progressive disclosure, dyslexia mode, reduced motion, keyboard/ARIA
- [x] Technical 10% — clean build, shared schema, structured AI output, persistence, extension
- [x] Presentation 10% — landing page thesis line + README + demo-ready flow

## Manual Steps Register (mirror into BUILD_REPORT)
- [x] 1. Create free Supabase project → set `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — **done**, real values are in `.env.local`
- [x] 2. Re-run `supabase/schema.sql` in the Supabase SQL editor — **done**, confirmed by live save points existing in the workspace under the accounts schema
- [x] 3. Create **free** Gemini API key (aistudio.google.com) → set `GOOGLE_API_KEY` — **done**, confirmed working via `curl` and a live `reconstruct()` call returning a genuine, accurate result. Note: `GEMINI_MODEL` had to change to `gemini-flash-latest` — `gemini-2.0-flash` returns `429 limit:0` (dead on the free tier) and `gemini-1.5-flash` 404s (fully retired)
- [x] 3b. `SESSION_SECRET` — **done**, generated automatically and already in `.env.local` (this one didn't need an external account, so it wasn't left as a manual step)
- [x] 4. `npm install` → `npm run dev` → open `/`, sign up at `/signup`, confirm you land in `/workspace` — **unblocked**, steps 2 and 3 are done
- [!] 5. Load extension (chrome://extensions → Load unpacked → `extension/`) → click the icon → log in with the same username/password (no device id, no copy-paste) — **still outstanding**, requires clicking through the actual Chrome UI
- [~] 6. End-to-end runtime check: sign up → save → reconstruct → restore → save from the extension → confirm it appears in the same account's list — **save/reconstruct/restore confirmed working directly**; the extension leg is still outstanding pending step 5
- [!] 7. Record 3-min demo, write Devpost description, make GitHub repo public
- [!] 8. Run dyslexic-tester session; capture one quote + one design change
- [!] 9. Any git commit/push (agent never does this)
