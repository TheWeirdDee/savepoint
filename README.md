# Save Point

**Restores where your thinking left off.**

An AI re-entry tool for neurodivergent students. Most tools restore your *files*.
Save Point captures a lightweight snapshot of a study session and later
reconstructs *where you were, what you'd figured out, and the single next action
to resume* — leading with that action, holding everything else behind
"More context," and speaking in a confidence-tiered voice that **asks instead of
fabricating** when it's unsure.

---

## What's in here

```
save-point/
  src/
    app/
      layout.tsx               Atkinson Hyperlegible + Lexend, applies a11y prefs pre-paint
      page.tsx                 LANDING PAGE (public) — the thesis, how it works, who it's for
      globals.css               ND-first design tokens + accessibility class hooks
      login/page.tsx            username + password login
      signup/page.tsx           email, full name, username, password
      workspace/page.tsx        session-protected — redirects to /login if signed out
      api/
        auth/
          signup/route.ts       create account, hash password, sign session
          login/route.ts        verify password, sign session (also CORS-enabled for the extension)
          me/route.ts           resolve the current session to a user
          logout/route.ts       clear the session cookie
        save-points/route.ts    POST create, GET list, PATCH correct/mark-restored (all session-scoped)
        reconstruct/route.ts    POST — run Gemini, cache the reconstruction, mark restored
    components/
      Workspace.tsx             the app shell: write, save, on-load restore offer, restore, log out
      LoginForm.tsx / SignupForm.tsx   the account forms
      SavePointButton.tsx       one-tap deliberate save, optional typed/dictated note
      RestoreCard.tsx           next step first, then where-you-were, then confirm
      RestoreOffer.tsx          calm "Welcome back" pull (no time-guilt)
      ConfidenceLine.tsx        gentle tier marker (sage/marker/ask), never an alarm flag
      MoreContext.tsx           progressive disclosure for everything secondary
      AccessibilityBar.tsx      text size, spacing, dyslexia font, reduced motion (floating + inline variants)
      SavePointList.tsx         past save points, no badges/dots
    lib/
      types.ts                  the one shared schema (confidence is a TIER, not a float)
      auth.ts                   password hashing, session JWTs, cookie + Bearer resolution
      cors.ts                   CORS headers for the two routes the extension calls cross-origin
      reconstruct-prompt.ts     the core AI job: sparse-signal fusion, no fabrication, low-context path
      reconstruct.ts            calls Gemini, parses strict JSON defensively, honest fallback
      gemini.ts                 server-only lazy Gemini client + MODEL constant
      supabase.ts               server-only lazy service-role client
      client.ts                 draft persistence + API client (browser)
      map.ts                    DB row -> API shape
  supabase/schema.sql            users + save_points tables, locked-down RLS
  extension/                     Manifest V3 sensor (popup + options) — desktop only, login-based
  .env.example
```

---

## Setup

**Prerequisites:** Node 18+, a free Supabase project, a free Google Gemini API key.

1. **Install**
   ```bash
   npm install
   ```

2. **Database** — open the Supabase SQL editor and run `supabase/schema.sql`. This
   creates the `users` table and a `save_points` table owned by `user_id`.

3. **Environment** — copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...      # server-only; never shipped to the client
   GOOGLE_API_KEY=...                 # free key from aistudio.google.com
   GEMINI_MODEL=gemini-flash-latest   # optional override, this is the default
   SESSION_SECRET=...                 # any long random string, e.g. `openssl rand -base64 48`
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 for the landing page. Click **Sign up**, create an
   account (email, full name, username, password), and you'll land in
   `/workspace` automatically.

> **Webpack, not Turbopack.** Both `dev` and `build` scripts pass `--webpack`
> on purpose. Do not remove that flag.

> **Fonts fetch at build time.** `next/font/google` pulls Atkinson Hyperlegible
> and Lexend during the build. This needs network access to Google Fonts
> (fine locally and on Vercel).

---

## Accounts

Simple username/password accounts — no email verification, no magic links, no
OAuth. Signup collects email, full name, username, and password; email and
username are both unique. Passwords are hashed with bcrypt (cost 12) and never
stored or logged in plain text. A session is a JWT signed with `SESSION_SECRET`,
handed to the browser as an httpOnly cookie and also returned in the JSON body
so the extension can store and replay it as a Bearer token. `/workspace` is a
server-protected route — visiting it without a valid session redirects to
`/login`. Every save point is owned by `user_id`; there is no more anonymous
device-id pairing.

---

## Deploy (Vercel)

1. Push to a repo and import it into Vercel.
2. Add the five env vars above in the Vercel project settings.
3. Deploy. The `/api/*` routes run as Node server functions (they hold the
   service-role, Gemini, and session-signing secrets).

---

## The browser extension (desktop only)

The extension is a thin **sensor**: it captures the same packet the workspace
sends and posts it to the same API, so a save made from any web page shows up in
your workspace. Restore always happens in the calm workspace, never in the popup.
It does not run on mobile browsers (Manifest V3 extensions require desktop Chrome).

**Load it:**
1. Chrome → `chrome://extensions` → enable Developer mode → **Load unpacked** →
   select the `extension/` folder.

**Sign in (one time):**
1. Click the Save Point icon. It opens straight to a small login form.
2. Enter the **same username and password** you used to sign up in the workspace.
3. That's it — no codes, no device ids to copy. The extension's **Workspace
   address** defaults to `http://localhost:3000`; change it in the extension's
   **Options** page if you deploy the workspace somewhere else.

Now the popup's **Save where my brain is** captures the active tab, any selected
text, a short page snippet, and your other open tab titles — plus an optional
note — into the same account as your workspace saves. If the session ever
expires, the popup drops back to the login form automatically.

---

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

**Have two save points pre-made** before recording: one rich (document + note +
tabs) for beat 5, one deliberately thin (just a URL) for beat 6. **Have a demo
account created ahead of time** so beat 7 is just "open the extension and log in,"
not a live signup.

---

## Neurodivergent-user evidence

Design authority: built by an ADHD developer from lived experience of the
re-entry problem — say this plainly, don't claim it speaks for all ADHD minds.
Testing: run one ~20-minute session with a dyslexic tester on the restore flow.
Ask what they forget after leaving an assignment, whether the restore card feels
accurate, whether the next action is small enough to start, and what feels
overwhelming. Then write it up specifically, protecting their privacy, with one
concrete change — that's what turns the impact story from *claimed* to
*demonstrated*. See `BUILD_REPORT.md` for the exact manual step.

---

## How to describe the AI

Not a chatbot, not a summarizer. The model fuses **incomplete** signals — the
optional note, recent writing, selected text, the active source, and open tabs —
to infer the **cognitive state most useful for re-entry**, and tags each
inference with a confidence tier that controls how it speaks. When evidence is
weak, it asks a gentle question rather than inventing certainty. A confidently
wrong reconstruction would be worse than no tool, so honesty is built into the
model's contract, not bolted on.

---

## Scope (deliberately bounded)

One user, one document at a time, manual save points. Accounts are simple
username/password only — no OAuth, no email verification, no password reset
flow yet. **Excluded:** collaboration, teacher dashboards, automatic
interruption detection, passive monitoring, browser-history reading, rich-text
editing, calendar/reminders, gamification. A powerful restore + a tiny
extension beats a weak restore + a fancy extension.

---

## Status

`npm run build` (webpack) exits 0. `tsc --noEmit` is clean. Accounts, save,
and restore are all runtime-verified against a live Supabase project and a
real, working Gemini key — `reconstruct()` was called directly and returned a
genuine, accurate reconstruction (not a fallback). Note: `gemini-2.0-flash`
is dead on the free tier as of this build; the working model is
`gemini-flash-latest` (an alias, not a pinned version, so it shouldn't go
stale the same way). Still outstanding: an extension-side login/save round
trip through the actual Chrome UI, since that requires clicking through the
browser rather than something verifiable from here. See `BUILD_REPORT.md`
for the full Manual Steps Register, the "ACCOUNTS PASS" section, and the
"Gemini model fix" section for exactly what changed and how it was verified.
