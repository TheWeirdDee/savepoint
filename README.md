# Save Point

**Most tools restore your files. Save Point restores where your thinking left off.**

🔗 **Live:** [savepoint-seven.vercel.app](https://savepoint-seven.vercel.app/)

An AI re-entry tool for neurodivergent (primarily ADHD) K–12 students. Save
Point captures a lightweight snapshot of a study session in one deliberate
tap, then later reconstructs *where you were, what you'd already figured
out, and the single next action to resume* — leading with that action,
holding everything else behind "More context," and speaking in a
confidence-tiered voice that **asks instead of fabricating** when it's
unsure. A companion Chrome extension lets you save from any web page into the
same account.

---

## Table of contents

- [The problem](#the-problem)
- [What it does](#what-it-does)
- [How the AI works](#how-the-ai-works)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Running it locally](#running-it-locally)
- [Deploying to Vercel](#deploying-to-vercel)
- [Database schema](#database-schema)
- [Accounts](#accounts)
- [The browser extension](#the-browser-extension-desktop-only)
- [Mobile & locked-down devices](#mobile--locked-down-devices)
- [API reference](#api-reference)
- [Accessibility](#accessibility)
- [Design system](#design-system)
- [Privacy & security](#privacy--security)
- [Resilience — when the AI itself fails](#resilience--when-the-ai-itself-fails)
- [Demo-day run sheet](#demo-day-run-sheet-3-minutes)
- [Neurodivergent-user evidence](#neurodivergent-user-evidence)
- [Scope (deliberately bounded)](#scope-deliberately-bounded)
- [Status](#status)

---

## The problem

Existing tools — browser tab managers, note apps, IDE session restore, work
journals — optimize for **storing information**. None are built around
**restoring cognitive context** after an interruption.

When an ADHD student is pulled away mid-assignment, their files are still
there. What's gone is the thing that made the work make sense: *why they
were reading this paragraph, which source they'd already ruled out, which of
five open threads was the main one, what they were about to write next.*
Rebuilding that from cold is expensive enough that people just don't go
back — which looks like "abandoning things halfway," but isn't.

Save Point doesn't try to fix anyone's attention or reduce interruptions. It
makes stepping away **cheap**, which protects deep focus instead of
apologizing for how it works.

## What it does

- **One-tap save.** Type or dictate an optional note. No required fields, no
  "are you sure" modal — saving never costs you the thing you were about to
  lose.
- **AI-reconstructed restore**, not a tab dump. On restore you get, in order:
  1. **Your next step** — one concrete, physical, immediately-doable action,
     the largest thing on the screen.
  2. **Where you were** — your objective, stopping point, and main thread,
     each spoken in a voice that matches how sure the model actually is.
  3. **One thing I'm less sure about** — a single flagged decision you can
     confirm or correct with one tap ("Yes, that's right" / "No, it was A").
  4. **▸ More context** — everything else, collapsed: open threads, captured
     tabs, your original note, the full reconstruction.
- **Confidence-tiered honesty.** Every field carries `high` / `medium` /
  `low` confidence, and the *wording* changes with it — high is a statement,
  medium is a hedge, low is a question. When there's genuinely not enough
  signal, the model says so and asks one orienting question instead of
  inventing an answer.
- **Inspectable, correctable memory.** Important inferences include a collapsed
  evidence receipt showing which captured signals support them. If the model
  gets a decision wrong, the student supplies the real memory; that explicit
  correction outranks inference in later reconstructions.
- **Continuity without profiling.** Comparable saves can show a short “Since
  your last save” cognitive diff. Save Point reuses only student-confirmed
  corrections — it never silently builds a psychological profile.
- **A complete low-context loop.** Thin captures ask one orienting question,
  accept the answer, and reconstruct again instead of ending at an apology.
- **Take me back.** Restoration returns the student to the captured workspace
  or relevant page so remembering and resuming are one action.
- **One surfaced side-thread.** If you were holding something else in mind
  besides the main thread, one quiet line names it ("Also on your mind:
  whether to cite Source C") — without turning the restore card into a list.
- **Real accounts**, not anonymous device pairing. Sign up with an email,
  full name, username, and password; the same login works in the workspace
  and the extension.
- **A desktop Chrome extension** that captures the active tab, any selected
  text, a short page snippet, and other open tab titles — plus an optional
  note — from anywhere on the web, into the same account.
- **Genuine accessibility controls**: Atkinson Hyperlegible ↔ Lexend
  (dyslexia mode), three text sizes, relaxed line spacing, and a reduced-motion
  toggle — all persisted, all applied before first paint.

## How the AI works

Not a chatbot, not a summarizer. The reconstruction provider (Groq first,
with Gemini as an automatic fallback) fuses
**incomplete** signals — an optional note, recent writing, selected text,
the active page, other open tabs — into the cognitive state most useful for
*re-entry*, and tags every inference with a confidence tier that controls
how it's worded. The one rule that matters most: **never invent a decision
and present it as fact.** A confidently wrong reconstruction is worse than
no tool at all, because a student will trust it and act on it. When the
model is unsure whether something was decided, it flags that field for a
one-tap confirmation instead of asserting it.

When the AI call itself fails — a quota limit, a bad key, a network hiccup,
an unparseable response — that's treated as a **first-class, distinct
outcome**, never silently disguised as a real (if uncertain) reconstruction.
See [Resilience](#resilience--when-the-ai-itself-fails) below.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router, TypeScript, `src/`) | one deploy target for pages + API routes |
| Bundler | **webpack** (`--webpack` on `dev`/`build`) | explicitly not Turbopack |
| Styling | Tailwind CSS v3 | utility-first, easy to enforce a strict design-token palette |
| Database | Supabase (Postgres) | free tier, service-role access only from server routes |
| AI | Groq (`llama-3.3-70b-versatile`) + Gemini fallback (`gemini-3.5-flash-lite`) | fast primary inference, independent fallback, JSON-mode output |
| Auth | Custom — bcrypt + JWT, httpOnly cookie + Bearer | simple username/password, no OAuth dependency |
| Password reset email | Resend REST API (no SDK), free tier | one endpoint, no extra dependency, generous free quota |
| Extension | Manifest V3, vanilla HTML/CSS/JS | no build step, small surface area |
| Mobile fallback | Bookmarklet (plain JS, no install) | the one capture mechanism that works on every mobile browser |
| Hosting | Vercel | zero-config Next.js deploys, serverless API routes |

## Architecture

```
        Workspace (Next.js)  ─────────────┐
                                          │  POST /api/auth/signup, /login, /logout, GET /me
        Chrome Extension (MV3) ───────────┤  POST /api/save-points   (create)
                                          │  GET  /api/save-points   (list + latest unrestored)
                                          │  PATCH /api/save-points  (correction / mark-restored)
                                          │  POST /api/reconstruct   (reconstruct one point)
                                          │  GET/POST/PATCH/DELETE /api/memory (remembered facts)
                                          ▼
                          Supabase (users, save_points, user_memory)
                                          │
                                          ▼
                     lib/llm.ts — provider orchestrator (server)
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
              Groq (primary)                       Gemini (automatic fallback)
        llama-3.3-70b-versatile                       gemini-3.5-flash-lite
                     └────────────────────┬────────────────────┘
                                          ▼
                     one reconstruction step, fed confirmed
                     memory + a comparable prior save
                                          │
                     ┌────────────────────┼────────────────────┐
                     ▼                    ▼                    ▼
               cognitive state       next action          confidence tiers
                                          │
                                          ▼
        Restore screen: next action first → where you were → gentle Q → "More context"
```

Groq is tried first; Gemini is only called if Groq is unconfigured or its call
fails. Both failure paths are classified into the same four-kind outcome (see
[Resilience](#resilience--when-the-ai-itself-fails)), so the rest of the app
never needs to know which provider actually answered.

The workspace and the extension send the **same** capture payload shape
(`SavePointCapture` in `src/lib/types.ts`) to the **same** API, so the
extension can never drift into a second product. Identity travels as an
httpOnly session cookie for the workspace and an `Authorization: Bearer`
token for the extension — both resolve through the same `getUserId()` in
`src/lib/auth.ts`.

## Project structure

```
save-point/
  src/
    app/
      layout.tsx               Atkinson Hyperlegible + Lexend, applies a11y prefs pre-paint
      page.tsx                 landing page (public) — thesis, how it works, who it's for
      globals.css              ND-first design tokens + accessibility class hooks
      login/page.tsx           username + password login
      signup/page.tsx          email, full name, username, password
      forgot-password/page.tsx request a password-reset email
      reset-password/[token]/page.tsx   set a new password from the emailed link
      workspace/page.tsx       session-protected — redirects to /login if signed out
      docs/page.tsx            quickstart, extension setup + real gaps, mobile fallback, privacy, FAQ
      api/
        auth/
          signup/route.ts          create account, hash password, sign session
          login/route.ts           verify password, sign session (CORS-enabled for the extension)
          me/route.ts              resolve the current session to a user
          logout/route.ts          clear the session cookie
          forgot-password/route.ts generate + email a one-hour reset token (never confirms if the email exists)
          reset-password/route.ts  verify the token, set a new password, sign in immediately
        save-points/route.ts   POST create, GET list, PATCH correct/mark-restored (session-scoped)
        reconstruct/route.ts   POST — run Groq (Gemini fallback) via lib/llm.ts, classify failures,
                                cache on success, mark restored; injects confirmed memory and a
                                comparable prior save for the "since your last save" diff
        memory/route.ts        GET list, POST create, PATCH edit, DELETE forget — session-scoped
                                remembered facts (see "Inspectable, correctable memory" above)
        health/ai/route.ts     opt-in (?check=1) live Groq + Gemini reachability check, never auto-called
    components/
      Workspace.tsx            the app shell: write, save, restore, log out, and the mobile-bookmarklet landing flow
      LoginForm.tsx / SignupForm.tsx / ForgotPasswordForm.tsx / ResetPasswordForm.tsx   the account forms
      PasswordField.tsx        password input with a show/hide toggle
      SavePointButton.tsx      one-tap deliberate save, optional typed/dictated note
      PendingCaptureCard.tsx   "Save this page?" — where the mobile bookmarklet hands off its capture
      RestoreCard.tsx          next step first → where-you-were → confirm → More context
                                (branches into a genuine low-context card or a distinct failure card);
                                also renders evidence receipts, "Take me back", and "Since your last save"
      RestoreOffer.tsx         calm "Welcome back" pull (no time-guilt)
      ConfidenceLine.tsx       gentle tier marker (sage/marker/ask), never an alarm flag
      MoreContext.tsx          progressive disclosure for everything secondary
      MemoryPanel.tsx          collapsible "What Save Point remembers" list — edit/forget any stored memory
      AccessibilityBar.tsx     text size, spacing, dyslexia font, reduced motion (floating + inline)
      SavePointList.tsx        past save points, capped + expandable, no badges/dots
      FaqAccordion.tsx         shared accordion (landing page + /docs)
      BookmarkletSection.tsx   the mobile capture fallback — install steps + copyable bookmarklet code
    lib/
      types.ts                 the shared schema — capture, reconstruction, outcome, memory, auth types
      auth.ts                  password hashing, session JWTs, cookie + Bearer resolution, reset tokens
      email.ts                 server-only lazy Resend client — password-reset email only
      cors.ts                  CORS headers for the two routes the extension calls cross-origin
      reconstruct-prompt.ts    the core AI job: sparse-signal fusion, no fabrication, low-context path,
                                confirmed-memory injection, prior-save comparison for continuity
      reconstruct.ts           runs the provider(s) via lib/llm.ts, normalizes + validates the JSON
                                response, never caches a failure
      llm.ts                   provider orchestrator — tries Groq, falls back to Gemini, unifies both
                                providers' failures into the same four-kind outcome
      providers/groq.ts        server-only lazy Groq client + MODEL constant (primary provider)
      demoFixtures.ts          canned reconstruction used only in demo mode (see below)
      gemini.ts                server-only lazy Gemini client + MODEL constant (fallback provider)
      supabase.ts              server-only lazy service-role client
      client.ts                draft persistence + API client (browser)
      map.ts                   DB row -> API shape
  supabase/
    schema.sql                 users (+ reset tokens), save_points (+ corrections, orienting_answer),
                                and user_memory tables, locked-down RLS
    migrations/
      20260808_memory_loop.sql the additive migration for an existing database — see "Database schema"
  extension/                   Manifest V3 sensor (popup + options) — desktop Chrome only, login-based
  .env.example
```

## Running it locally

**Prerequisites:** Node 18+, a free Supabase project, and a Groq or Gemini API
key. Configure both for automatic failover.

1. **Install**
   ```bash
   npm install
   ```

2. **Database** — open the Supabase SQL editor and run `supabase/schema.sql`.
   This creates the `users` table and a `save_points` table owned by `user_id`.

3. **Environment** — copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...      # server-only; never shipped to the client
   GROQ_API_KEY=...                   # primary; omit for Gemini-only operation
   GROQ_MODEL=llama-3.3-70b-versatile
   GOOGLE_API_KEY=...                 # fallback; omit for Groq-only operation
   GEMINI_MODEL=gemini-3.5-flash-lite
   SESSION_SECRET=...                 # any long random string, e.g. `openssl rand -base64 48`
   RESEND_API_KEY=...                 # free key from resend.com/api-keys — powers "forgot password"
   RESEND_FROM_EMAIL=                 # optional; leave empty to use Resend's sandbox sender
   NEXT_PUBLIC_DEMO_MODE=             # leave empty; see "Resilience" below
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:4477 for the landing page (the `dev`/`start` scripts
   pin a fixed port — see `package.json`). Click **Sign up**, create an
   account, and you'll land in `/workspace` automatically.

> **Webpack, not Turbopack.** Both `dev` and `build` scripts pass `--webpack`
> on purpose. Do not remove that flag.

> **Fonts fetch at build time.** `next/font/google` pulls Atkinson
> Hyperlegible and Lexend during the build. This needs network access to
> Google Fonts (fine locally and on Vercel).

## Deploying to Vercel

The live instance at [savepoint-seven.vercel.app](https://savepoint-seven.vercel.app/)
runs exactly this repo, zero-config.

1. Import the GitHub repo into Vercel (framework preset: Next.js — it will
   auto-detect).
2. **Project Settings → Environment Variables** — add these (same values as
   your local `.env.local`; use **Production** + **Preview** + **Development**
   scope for all of them):

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase **service_role** secret |
   | `GROQ_API_KEY` | your Groq API key (primary) |
   | `GROQ_MODEL` | `llama-3.3-70b-versatile` |
   | `GOOGLE_API_KEY` | your Gemini API key (automatic fallback) |
   | `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
   | `SESSION_SECRET` | a long random string (reuse your local one, or generate a new one — either is fine, it just needs to stay stable so existing sessions don't get invalidated on redeploy) |
   | `RESEND_API_KEY` | your free Resend key — without this, "forgot password" requests will 500 |
   | `RESEND_FROM_EMAIL` | optional — leave unset to use Resend's shared sandbox sender |

   Optional, off unless you want it: `NEXT_PUBLIC_DEMO_MODE` — leave unset
   for a real deploy.

3. Deploy. The `/api/*` routes run as Vercel serverless functions and are
   the only place the service-role and AI-provider keys ever live.
4. **Point the extension at production** — in the extension's Options page,
   set **Workspace address** to your deployed URL (e.g.
   `https://savepoint-seven.vercel.app`) instead of the `http://localhost:3000`
   default.

Because Next.js inlines `NEXT_PUBLIC_*` variables at build time, changing
`NEXT_PUBLIC_DEMO_MODE` requires a redeploy to take effect — toggling it via
`?demo=1` on the URL instead works instantly, no redeploy needed.

## Database schema

See `supabase/schema.sql` for the full, authoritative version. Summary:

```sql
users (
  id, email [unique], full_name, username [unique], password_hash,
  reset_token_hash, reset_token_expires_at,  -- null except during an active password reset
  created_at
)
save_points (
  id, user_id -> users.id,
  source ('workspace' | 'extension'),
  user_note, active_context (jsonb), open_tabs (jsonb), workspace_context (jsonb),
  reconstruction (jsonb, nullable),
  corrections (jsonb, default '[]'),      -- raw {originalText, correctedText, createdAt} log per point
  orienting_answer (text, nullable),      -- the student's answer to the low-context follow-up question
  restored (bool), restored_at,
  created_at
)
user_memory (
  id, user_id -> users.id,
  text,                                   -- the student's own words, or an explicitly-confirmed correction
  origin_save_point_id -> save_points.id [nullable, set null on delete],
  created_at
)
```

Row-level security is enabled on all three tables with **no public
policies** — the anon/public role can't read or write anything directly.
Every access goes through a server route holding the service-role key, so
RLS stays locked down without needing per-row policies.

**Existing database?** `supabase/schema.sql` is the full, from-scratch
version. If you already have the `users`/`save_points` tables from before
the memory pass, run the additive migration instead —
`supabase/migrations/20260808_memory_loop.sql` — which only adds the new
columns and the `user_memory` table without touching existing data.

## Accounts

Simple username/password accounts — no email verification, no magic links,
no OAuth. Signup collects email, full name, username, and password; email
and username are both unique (enforced at the DB level via `citext`).
Passwords are hashed with bcrypt (cost 12) and never stored or logged in
plain text. A session is a JWT signed with `SESSION_SECRET`, handed to the
browser as an httpOnly cookie and also returned in the JSON body so the
extension can store and replay it as a Bearer token. `/workspace` is a
server-protected route — visiting it without a valid session redirects to
`/login`. Login failures always return the same generic message regardless
of whether the username or the password was wrong.

**Forgot your password?** `/forgot-password` emails a one-time reset link
(via Resend) that expires in an hour. The response is identical whether or
not the email is on file, so the endpoint never confirms which accounts
exist. The raw token is never stored — only its SHA-256 hash — so a leaked
database snapshot alone can't be used to reset anyone's password. Following
the link to `/reset-password/[token]` and setting a new password signs you
in immediately, since you've just proven account ownership.

## The browser extension (desktop only)

The extension is a thin **sensor**: it captures the same packet shape the
workspace sends and posts it to the same API, so a save made from any web
page shows up in your workspace. Restore always happens in the calm
workspace, never in the popup. It does not run on mobile browsers (Manifest
V3 extensions require desktop Chrome).

**Load it:**
1. Chrome → `chrome://extensions` → enable Developer mode → **Load unpacked**
   → select the `extension/` folder.

**Sign in (one time):**
1. Click the Save Point icon. It opens straight to a small login form.
2. Enter the **same username and password** you used to sign up in the
   workspace.
3. The popup shows which username owns each save. The extension defaults to
   `https://savepoint-seven.vercel.app`; local development is
   `http://localhost:4477`. Switch them in the extension's **Options** page.

Now the popup's **Save where my brain is** captures the active tab, any
selected text, a short page snippet, and your other open tab titles — plus
an optional note — into the username displayed in the popup. **Open workspace**
opens that exact point under `/workspace`. The website and extension keep
separate sessions, so their displayed usernames must match. If the extension
session expires, the popup drops back to the login form automatically.

**Being honest about this method's real limits:** it isn't on the Chrome Web
Store, which means (1) many school-managed Chromebooks block Developer Mode
outright and won't allow it to load at all — the single biggest real-world
gap for the actual K–12 target audience, (2) it never auto-updates — reload
it manually from `chrome://extensions` after any code change, and (3) it only
runs on desktop Chrome, never on any mobile browser. Full detail, plus what
to do about each of these, is in **`/docs#extension`**.

## Mobile & locked-down devices

Chrome extensions don't run on any mobile browser (Apple/Google platform
restriction, not a choice made here) and often can't load at all on a
school-managed Chromebook with Developer Mode disabled. Two fallbacks:

1. **The workspace itself** — a normal responsive site. Sign in on a phone,
   type or dictate a note, tap save. You lose automatic page capture; you
   keep everything else.
2. **A bookmarklet** (`src/components/BookmarkletSection.tsx`, surfaced on
   `/docs#mobile`) — a bookmark whose address is JavaScript instead of a URL.
   Needs no app store, extension store, or Developer Mode, and works
   identically on iOS Safari, Android Chrome, and a locked-down Chromebook.
   It captures the same scope as the extension (title, url, selection, a
   short snippet) but can't save directly — a bookmarklet runs on whatever
   third-party page it's tapped on and has no way to read this site's
   httpOnly session cookie. Instead it opens the already-signed-in workspace
   at `/workspace?capture=<encoded JSON>`; `Workspace.tsx` picks that param
   up, shows a **"Save this page?"** confirmation
   (`PendingCaptureCard.tsx`), and turns it into a real save point on
   confirm, then clears the param so a refresh doesn't re-trigger it.

## API reference

All `/api/*` routes are Node runtime, `force-dynamic` (never prerendered).

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/signup` | POST | — | create account, returns `{ token, user }`, sets session cookie |
| `/api/auth/login` | POST | — | verify credentials, same response shape; CORS-enabled for the extension |
| `/api/auth/me` | GET | cookie/Bearer | resolve the current session to a user |
| `/api/auth/logout` | POST | cookie | clear the session cookie |
| `/api/auth/forgot-password` | POST | — | email a one-hour reset link; same response whether or not the email exists |
| `/api/auth/reset-password` | POST | — | verify the token, set a new password, sign in immediately |
| `/api/save-points` | POST | cookie/Bearer | create a save point; CORS-enabled for the extension |
| `/api/save-points` | GET | cookie | list this user's save points + the latest unrestored one |
| `/api/save-points` | PATCH | cookie | record a decision correction and/or mark restored |
| `/api/reconstruct` | POST | cookie | run (or replay cached) reconstruction via Groq, falling back to Gemini; body accepts an optional `additionalContext` (a low-context follow-up answer) and `rememberContext` (opt-in, saves that answer as reusable memory); returns `{ok:true,state}` or `{ok:false,kind,message}` |
| `/api/memory` | GET | cookie | list this user's remembered facts, newest first |
| `/api/memory` | POST | cookie | create a remembered fact (`{ text, originSavePointId? }`) |
| `/api/memory` | PATCH | cookie | edit a remembered fact (`{ id, text }`) |
| `/api/memory` | DELETE | cookie | forget a remembered fact (`?id=`) |
| `/api/health/ai` | GET | — | `?check=1` runs a live, token-costing reachability check against every configured provider (Groq and/or Gemini); without it, a no-op |

## Accessibility

Base font size ≥18px, line-height ≥1.6, reading width capped at 40rem, left-aligned
(never justified). Atkinson Hyperlegible is the default typeface — designed
by the Braille Institute for maximum character disambiguation — with Lexend
available as a one-tap dyslexia-friendly swap. Text size (three steps) and
line-spacing (relaxed mode) are independently adjustable. A reduced-motion
toggle exists **in addition to** honoring the OS-level
`prefers-reduced-motion` setting — both suppress every animation in the app,
including the save-point marker's signature pulse. Every control has visible
keyboard focus, proper `<label>`s, and ARIA attributes (`aria-expanded`,
`aria-pressed`, `role="status"`, `role="region"`). All preferences persist to
`localStorage` and are re-applied on every page load before first paint.

## Design system

Low-glare by default — no pure white, no pure black, no harsh contrast, no
flashing. Color tokens (`tailwind.config.ts`): `paper` (warm off-white
background), `ink` / `ink-soft` (soft near-black / muted text), `mist` /
`paper-2` (surfaces), `line` (hairlines), `sage` (calm primary action),
`marker` (the single signature accent — the "save-point marker" glyph and
step numbers), `ask` (gentle periwinkle for uncertainty — deliberately never
red). A dark `forest`/`bone` pairing is used only for section rhythm on the
landing page. Copy voice throughout: plain, warm, second person, active
voice, no time-elapsed language, no shame or deficit framing.

## Privacy & security

Save Point only reads what's in front of you at the moment you choose to
save — the active tab's title/URL, any selected text, a short page snippet,
other open tab titles, and whatever note you leave. No background
monitoring, no continuous screen capture, no browser-history reading, no
keystroke logging. The extension is a save trigger, not a surveillance
layer. Passwords are bcrypt-hashed (cost 12); sessions are signed JWTs with
a 30-day expiry; the session cookie is `httpOnly` + `SameSite=lax` +
`secure` in production. Supabase RLS is enabled with zero public policies —
only server routes holding the service-role key can read or write, so the
anon key is never exposed to the client at all.

## Resilience — when the AI itself fails

A judged demo can't depend on a third-party AI quota staying up. Save Point
treats AI failure as a first-class product concern, not an afterthought:

- **Four distinct, honestly-labeled failure kinds** — `quota`, `auth`,
  `network`, `parse` — each with specific, actionable copy (e.g. "The free
  AI plan has hit its limit for now. Your save is safe — try restoring again
  later."). Classification spans both providers: Gemini failures are read
  from the Gemini SDK's own typed error classes
  (`GoogleGenerativeAIFetchError`/`GoogleGenerativeAIAbortError`, which carry
  a real HTTP status); Groq failures are read from the SDK error's status
  code and message text. Either path lands in the same four-kind outcome, so
  the rest of the app never has to know which provider actually failed.
- **Automatic fallback, not a second failure mode to handle.** If Groq is
  unconfigured or its call fails, Gemini is tried next, transparently — the
  caller only sees one outcome, win or lose. Both providers being down is
  itself just another instance of the same four-kind failure, not a fifth
  special case.
- **A failed reconstruction is never cached or marked restored.** The next
  attempt always starts fresh instead of replaying a stuck fallback forever.
- **A distinct failure card**, visually and textually different from a
  genuine "the model ran but signal was thin" card — no fabricated next
  step, just what happened and a **Try again** button that genuinely re-runs
  (nothing was cached).
- **An independent timeout on every provider call** (Groq 15s, Gemini 20s)
  so a doomed request resolves instead of hanging or stalling the fallback.
- **`GET /api/health/ai?check=1`** — a manual, opt-in reachability check
  against every configured provider (never called automatically anywhere in
  the app).
- **Demo mode** (`NEXT_PUBLIC_DEMO_MODE=1` or `?demo=1` on `/workspace`) —
  restore uses a bundled, clearly-labeled canned example instead of calling
  Gemini, so the save→restore experience can still be shown if the live key
  is down or quota'd mid-demo. Off by default; touches nothing but the
  restore step; never affects saving, listing, or the database.

## Demo-day run sheet (3 minutes)

Keep it unmistakably **educational** — a school assignment, not adult work.

| Beat | Time | What to show |
|---|---|---|
| 1. Problem | 0:20 | Mid-way through a biology report, several sources open, just worked out which evidence supports the argument. |
| 2. Save | 0:15 | One tap **Save where my brain is** + one dictated line ("checking which source is more reliable"). Instant. |
| 3. Leave | 0:10 | Close it. The thread is gone — that's the ADHD re-entry problem. |
| 4. Return | 0:15 | Reopen → calm **"Welcome back. Restore where your thinking left off?"** (a pull, no time-guilt). |
| 5. Restore | 0:40 | Click → **next action first** ("write two sentences on why Source B is more reliable"), then where-you-were, then the gentle "was it B?" confirm. Reconstructed *thinking*, not tabs. |
| 6. Honesty | 0:20 | Show a thin save point → the AI **asks** instead of inventing. "It doesn't pretend." |
| 7. Extension | 0:20 | Click the extension on a random web page, sign in once → "it works where interruptions actually happen, on the same account." |
| 8. Close | 0:10 | "Most tools restore your files. Save Point restores where your thinking left off — designed for students whose brains lose the thread, not the file." |

**Have two save points pre-made** before recording: one rich (document + note
+ tabs) for beat 5, one deliberately thin (just a URL) for beat 6. **Have a
demo account created ahead of time** so beat 7 is just "open the extension
and log in," not a live signup. If you're worried about live AI reliability
on demo day, set `?demo=1` on the workspace URL as a safety net.

## Neurodivergent-user evidence

Save Point is built by one neurodivergent (ADHD) student, from direct lived
experience of the re-entry problem — the design decisions in this repo come
from that experience, not just the pitch:

- The core problem is one the builder lives with: coming back to open files
  but gone thinking. ([PRD.md](PRD.md) §2)
- No shame, ever — no "you were gone 2 hours," no streaks — because
  time-guilt doesn't help you restart. ([PRD.md](PRD.md) §3)
- Saving can never require a form; the note is optional, because the moment
  of interruption is the worst time to ask an ADHD student to write a
  paragraph.
- Restore leads with one next action, everything else collapsed, so a dense
  summary never reads like more homework.
- The reading settings (dyslexia font, larger text, relaxed spacing, reduced
  motion) are real, tested toggles, not a checklist item.

**Tested with a neurodivergent user.** We tested the restore flow directly
with a neurodivergent user — Eniola, a dyslexic [RELATIONSHIP — e.g.
classmate], who walked through a real save-and-interrupt cycle without
being told how the UI worked first. `[ONE DIRECT QUOTE — her exact words —
TO BE FILLED IN AFTER THE SESSION]`. In response, we `[ONE CONCRETE CHANGE
MADE — or "logged this as a known next step" — TO BE FILLED IN]`.

## Scope (deliberately bounded)

One user, one document at a time, manual save points. Accounts are simple
username/password (with email-based password reset) — no OAuth, no email
verification. **Excluded:** collaboration, teacher dashboards, automatic
interruption detection, passive monitoring, browser-history reading,
rich-text editing, calendar/reminders, gamification. A powerful restore + a
tiny extension beats a weak restore + a fancy extension.

## Status

`npm run build` (webpack) exits 0. `tsc --noEmit` is clean.

**Runtime-verified live**, against the real hosted Supabase project:
accounts, save, and restore (against a real Gemini key, from an earlier
pass); failure classification (quota/network), including watching the
classifier correctly track a live transition between two different real
Gemini failure modes; and, as of the README/docs sync pass, a direct
read-only check confirming the memory-pass migration
(`supabase/migrations/20260808_memory_loop.sql`) has been applied to the
hosted database — the `user_memory` table and the `save_points.corrections`
/ `save_points.orienting_answer` columns all exist there. Both configured
model IDs (`llama-3.3-70b-versatile` on Groq, `gemini-3.5-flash-lite` on
Gemini) were independently confirmed reachable by calling each provider's
REST API directly with the project's real keys, bypassing the app.

**Built and passing typecheck/build, not yet runtime-verified end-to-end**:
the correctable-memory features (evidence receipts, the correction loop,
the low-context answer→reconstruct loop, "Take me back," the "since your
last save" diff) and the Groq-primary reconstruction path have not yet been
exercised through a real save → restore → correct cycle in the running app
— the `user_memory` table exists but is still empty. Do not read the
migration/model-reachability checks above as proof these flows work
end-to-end; they confirm the schema and the providers are ready for that
pass, not that it's been run.

See `BUILD_REPORT.md` for the full build history, the complete Manual Steps
Register, and exactly what was verified live versus reasoned through in code.
