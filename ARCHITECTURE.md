# Save Point — Architecture

## 1. System overview

Two capture surfaces feed one brain. The **web app** is the product (accounts, workspace, restore). The **Chrome extension** is a thin desktop sensor. Both send the **same** capture payload to the **same** API, so the extension can never drift into a second product. Reconstruction runs through a **provider orchestrator** — Groq first, Gemini as an automatic fallback — so the rest of the app never has to know which one actually answered.

```
        Workspace (Next.js)  ─────────────┐
                                          │  POST /api/auth/signup, /login, /logout, GET /me
        Chrome Extension (MV3) ───────────┤  POST  /api/save-points   (create)
                                          │  GET   /api/save-points   (list + latest unrestored)
                                          │  PATCH /api/save-points   (record correction / restored)
                                          │  POST  /api/reconstruct   (reconstruct one point)
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
                     cognitive state, fed confirmed memory +
                     a comparable prior save for continuity
                                          │
                     ┌────────────────────┼────────────────────┐
                     ▼                    ▼                    ▼
               cognitive state       next action          confidence tiers
                                          │
                                          ▼
        Restore screen: next action first → where you were → gentle Q → "More context"
```

## 2. Data flow

1. Student signs up or logs in (`bcrypt` + JWT session — see §8) and works in the workspace, or browses the web with the extension signed into the same account.
2. Student clicks **Save Point** (deliberate). A `SavePointCapture` packet is assembled from present signals.
3. `POST /api/save-points` writes a row to Supabase, owned by `user_id` (no reconstruction yet — save is instant).
4. Later, the workspace loads → `GET /api/save-points` → if an unrestored point exists, show one calm restore offer (pull, not push).
5. Student clicks **Restore** → `POST /api/reconstruct` loads the row, loads up to 5 recent confirmed `user_memory` rows and (if one exists) a comparable prior save for the same document/URL, then calls the provider orchestrator (`lib/llm.ts`): Groq first, Gemini if Groq is unconfigured or fails. The response is parsed as strict JSON, normalized, cached as the `ReconstructedState` on the row, the row is marked restored, and the result is returned.
6. Restore screen renders next-action-first with confidence-tiered voice. Fields may carry a collapsed evidence receipt (which captured signal supports them). Uncertain decisions offer a one-tap correction → `PATCH /api/save-points`, which also writes an authoritative `user_memory` row so future reconstructions never repeat the same wrong guess.
7. If the reconstruction was low-context, the student can answer one orienting question inline; `POST /api/reconstruct` re-runs with that answer merged in, and — only if the student opts in — persists it as reusable memory via `POST /api/memory`.
8. "Take me back" reopens the captured page (workspace content, or the active/open-tab URLs for an extension capture) and copies the next action, so remembering and resuming are one action.

## 3. Directory layout

```
save-point/
  README.md
  .env.example
  package.json                 # webpack scripts, dev/start pinned to port 4477
  next.config.js
  tsconfig.json
  tailwind.config.ts
  postcss.config.js
  supabase/
    schema.sql                 # full, from-scratch schema
    migrations/
      20260808_memory_loop.sql # additive migration for an existing database
  src/
    app/
      layout.tsx               # fonts, theme, AccessibilityBar
      globals.css               # design tokens (CSS variables)
      page.tsx                  # LANDING PAGE (public)
      login/, signup/            # account forms
      forgot-password/, reset-password/[token]/   # password reset
      workspace/page.tsx        # session-protected — redirects to /login if signed out
      api/
        auth/                   # signup, login, me, logout, forgot-password, reset-password
        save-points/route.ts    # POST create, GET list, PATCH correct/restore (session-scoped)
        reconstruct/route.ts    # POST — provider orchestrator, memory injection, caching
        memory/route.ts         # GET/POST/PATCH/DELETE — session-scoped remembered facts
        health/ai/route.ts      # opt-in (?check=1) live Groq + Gemini reachability check
    components/
      Workspace.tsx             # client: doc area + save + list + restore
      SavePointButton.tsx
      SavePointList.tsx
      RestoreOffer.tsx          # on-load calm restore offer
      RestoreCard.tsx           # next action first, evidence receipts, correction,
                                 # "Take me back", "Since your last save", collapsed detail
      ConfidenceLine.tsx        # renders a field in the voice for its tier
      MoreContext.tsx           # collapsed secondary detail
      MemoryPanel.tsx           # "What Save Point remembers" — edit/forget any stored memory
      AccessibilityBar.tsx      # font / size / reduced-motion (persisted)
    lib/
      types.ts                  # shared schema (below)
      auth.ts                   # bcrypt + JWT session, cookie + Bearer resolution
      client.ts                 # API client + local draft persistence (browser)
      supabase.ts               # lazy server client
      llm.ts                    # provider orchestrator: Groq primary, Gemini fallback,
                                 # unified failure classification
      providers/groq.ts         # lazy Groq client + MODEL constant
      gemini.ts                 # lazy Gemini client + MODEL constant (fallback)
      reconstruct.ts            # runs the orchestrator, normalizes + validates the JSON response
      reconstruct-prompt.ts     # system prompt + user-message builder, memory injection
      map.ts                    # DB row <-> API shape
  extension/
    manifest.json
    popup.html / popup.css / popup.js
    options.html / options.js   # workspace address + account sign-in
```

## 4. Shared data contracts (`src/lib/types.ts`)

```ts
export type CaptureSource = "workspace" | "extension";

export type SavePointCapture = {
  source: CaptureSource;
  userNote?: string;                 // optional, typed OR dictated — never required
  activeContext: {
    title?: string; url?: string; selectedText?: string; visibleTextSnippet?: string;
  };
  openTabs?: Array<{ title: string; url: string }>;
  workspaceContext?: {
    documentTitle?: string; documentContent?: string; recentEdits?: string;
  };
};

// Tier, not float. high->statement, medium->hedge, low->question.
export type Confidence = "high" | "medium" | "low";

export type EvidenceSource = "note" | "recent-writing" | "selection" | "active-page" | "open-tab";

export type ReconstructionEvidence = { source: EvidenceSource; excerpt: string };

export type ReconstructedField = {
  text: string;
  confidence: Confidence;
  evidence: ReconstructionEvidence[];   // input provenance only, never hidden reasoning
};

export type ReconstructedState = {
  objective: ReconstructedField;
  stoppingPoint: ReconstructedField;
  mainThread: ReconstructedField;
  decisions: Array<{
    text: string; confidence: Confidence; needsConfirmation: boolean;
    evidence: ReconstructionEvidence[];
  }>;
  openThreads: Array<{ text: string; relevance: "primary" | "supporting" | "uncertain" }>;
  nextAction: ReconstructedField;
  whatChanged: string[];             // "since your last save" diff; empty when no comparable prior save
  lowContext: boolean;
  orientingQuestion: string;         // filled only when lowContext
};

export type ReconstructionMemory = {
  confirmedMemories: string[];       // up to 5 most recent user_memory rows, newest first
  previousCapture?: SavePointCapture; // the comparable prior save, if one exists
};

export type UserMemory = {
  id: string; text: string; originSavePointId: string | null; createdAt: string;
};

export type SavePoint = {
  id: string; userId: string; source: CaptureSource;
  userNote: string | null;
  activeContext: SavePointCapture["activeContext"];
  openTabs: NonNullable<SavePointCapture["openTabs"]>;
  workspaceContext: NonNullable<SavePointCapture["workspaceContext"]>;
  reconstruction: ReconstructedState | null;
  corrections: Array<{ originalText: string; correctedText: string; createdAt: string }>;
  orientingAnswer: string | null;
  restored: boolean; restoredAt: string | null; createdAt: string;
};
```

**Capture scope limit (never exceed):** active tab title/URL, selected text, a short page snippet, optional other-tab titles, the optional note, and the workspace document itself. No full browser history, keystrokes, continuous screen capture, or cross-tab reading. The one local exception — a plain-text draft of the workspace document kept in `localStorage` for the save safety-net — never leaves the device except through an explicit save.

## 5. Database schema (`supabase/schema.sql`)

```sql
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null,
  full_name text not null,
  username citext unique not null,
  password_hash text not null,
  reset_token_hash text,
  reset_token_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.save_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source text not null check (source in ('workspace','extension')),
  user_note text,
  active_context jsonb not null default '{}'::jsonb,
  open_tabs jsonb not null default '[]'::jsonb,
  workspace_context jsonb not null default '{}'::jsonb,
  reconstruction jsonb,
  corrections jsonb not null default '[]'::jsonb,
  orienting_answer text,
  restored boolean not null default false,
  restored_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  origin_save_point_id uuid references public.save_points(id) on delete set null,
  created_at timestamptz not null default now()
);
```

RLS is enabled on all three tables with **no public policies**; access only through server routes holding the service-role key. `supabase/migrations/20260808_memory_loop.sql` is the additive path onto an existing pre-memory-pass database (adds `corrections`, `orienting_answer`, and the `user_memory` table without touching existing rows).

## 6. API surface

- `POST /api/auth/signup` / `POST /api/auth/login` — create/verify account, return `{ token, user }`, set an httpOnly session cookie.
- `GET /api/auth/me` — resolve the current session (cookie or Bearer) to a user.
- `POST /api/auth/logout` — clear the session cookie.
- `POST /api/auth/forgot-password` / `POST /api/auth/reset-password` — one-hour Resend-emailed reset link, SHA-256-hashed token.
- `POST /api/save-points` — body `{ capture: SavePointCapture }` → inserts a row owned by the session's `user_id` → `{ savePoint }`.
- `GET /api/save-points` → `{ savePoints, latestUnrestored }` (session-scoped, newest first).
- `PATCH /api/save-points` — body `{ savePointId, correction? }` → stores a correction (also writes an authoritative `user_memory` row) and/or marks restored.
- `POST /api/reconstruct` — body `{ savePointId, force?, additionalContext?, rememberContext? }` → loads the row, injects confirmed memory + a comparable prior save, runs the provider orchestrator, caches `ReconstructedState`, marks restored → returns it.
- `GET /api/memory`, `POST /api/memory`, `PATCH /api/memory`, `DELETE /api/memory` — session-scoped CRUD over `user_memory`.
- `GET /api/health/ai?check=1` — opt-in, live reachability probe of every configured provider.

All routes: `export const dynamic = "force-dynamic";` and `export const runtime = "nodejs";`.

## 7. AI pipeline

- `llm.ts` — `runReconstructionModel(system, user)`: tries Groq (if `GROQ_API_KEY` set), then Gemini (if `GOOGLE_API_KEY` set) on any Groq failure; classifies each provider's failure into the shared `quota | auth | network | parse` kind and surfaces the most informative one if both fail. `checkReconstructionProviders()` backs the opt-in health check.
- `providers/groq.ts` — lazy `getGroq()` reading `GROQ_API_KEY`; `GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"`. Uses the Groq SDK's OpenAI-compatible chat-completions endpoint with `response_format: { type: "json_object" }`.
- `gemini.ts` — lazy `getGemini()` reading `GOOGLE_API_KEY`; `GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite"`.
- `reconstruct-prompt.ts` — system prompt (reconstruct cognitive state, not summarize; no fabrication; tier→voice; one physical next action; low-context path; no time/shame language; evidence is input provenance, never hidden reasoning; exact JSON shape) + user-message builder that includes only present signals (truncated), the up-to-5 most recent confirmed memories (explicitly marked authoritative — never contradicted or overridden), and, when a comparable prior save exists, its raw snapshot for the "since your last save" diff.
- `reconstruct.ts` — calls the orchestrator, then **defensive parse**: strip stray fences, `JSON.parse`, validate tiers/arrays/`lowContext`/evidence (allow-listed sources only, excerpts capped at 140 chars, at most 2 per field), force `whatChanged` empty when there was no comparable prior save; on any failure return a distinct `{ ok: false, kind, message }` outcome — never a fabricated reconstruction.

## 8. Persistence & identity

Real accounts: email, full name, username, and password, hashed with bcrypt (cost 12). A session is a JWT signed with `SESSION_SECRET`, issued as an httpOnly cookie for the workspace and also returned in the response body so the extension can store and replay it as a `Bearer` token — both resolve through the same `getUserId()` in `src/lib/auth.ts`. Save points and remembered facts are owned by `user_id`, not a device id. There is no anonymous mode.

## 9. Extension (desktop only)

MV3, no build step. Popup: sign in with the same username/password as the workspace, then three states (Ready → optional note → Saved); no dashboard/AI/history in the popup. Captures only allowed fields; posts the shared payload to `POST /api/save-points` with the session's Bearer token. Options page sets the workspace base URL. Never claims mobile support — see the README's mobile-fallback section for the bookmarklet that covers that gap instead.

## 10. Privacy

Deliberate, minimal capture only at the moment of save — no continuous monitoring, no history scraping, no cross-tab reading. This is both a design principle and the safety story for a tool used by minors. The extension is a save trigger, not a surveillance layer. The one local-only exception is the workspace draft safety-net: a plain-text copy of the document being typed, kept in `localStorage`, read only to offer "want me to save your place?" after real inactivity — never sent anywhere except through an explicit save.

## 11. Keyed technical decisions (with rationale)

- **Webpack, not Turbopack** — no working native binary in the target environment.
- **Lazy server clients (Supabase, Groq, Gemini)** — importing a route during `next build` must never throw when env vars are absent; fail only if actually called at runtime unconfigured.
- **`force-dynamic` routes** — these are runtime data/AI endpoints; never prerender.
- **Confidence as an enum tier, not a float** — the model is better at a rough tier than a calibrated decimal, and the tier maps cleanly to three speech registers.
- **Groq primary, Gemini automatic fallback** — Groq is fast and has a generous free tier; an independent second provider means a single vendor's outage or quota exhaustion doesn't take down reconstruction, and the failure-classification contract stays identical either way.
- **Confirmed memory outranks inference** — a student's explicit correction or opted-in answer is the one thing the model is told never to contradict; everything else stays a probabilistic guess with a confidence tier attached.
- **Real accounts, not anonymous device pairing** — save points, corrections, and remembered facts are personal and needed to survive across devices/browsers; a device id can't do that and can't support "the same login in the extension and the workspace."
