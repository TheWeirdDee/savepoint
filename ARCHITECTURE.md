# Save Point — Architecture

## 1. System overview

Two capture surfaces feed one brain. The **web app** is the product (workspace + restore). The **Chrome extension** is a thin desktop sensor. Both send the **same** capture payload to the **same** API, so the extension can never drift into a second product.

```
        Workspace (Next.js)  ─────────────┐
                                          │  POST  /api/save-points   (create)
        Chrome Extension (MV3) ───────────┤  GET   /api/save-points   (list + latest unrestored)
                                          │  PATCH /api/save-points   (record correction / restored)
                                          │  POST  /api/reconstruct   (reconstruct one point)
                                          ▼
                                     Supabase (save_points table)
                                          │
                                          ▼
                            Gemini Flash reconstruction (server)
                                          │
                     ┌────────────────────┼────────────────────┐
                     ▼                    ▼                    ▼
               cognitive state       next action          confidence tiers
                                          │
                                          ▼
        Restore screen: next action first → where you were → gentle Q → "More context"
```

## 2. Data flow

1. Student works in the workspace (or browses the web with the extension).
2. Student clicks **Save Point** (deliberate). A `SavePointCapture` packet is assembled from present signals.
3. `POST /api/save-points` writes a row to Supabase (no reconstruction yet — save is instant).
4. Later, the workspace loads → `GET /api/save-points` → if an unrestored point exists, show one calm restore offer (pull, not push).
5. Student clicks **Restore** → `POST /api/reconstruct` loads the row, calls Gemini Flash, parses strict JSON, caches the `ReconstructedState` on the row, marks it restored, returns it.
6. Restore screen renders next-action-first with confidence-tiered voice; uncertain decisions offer a one-tap correction → `PATCH /api/save-points`.

## 3. Directory layout

```
save-point/
  README.md
  .env.example
  package.json                 # webpack scripts
  next.config.js
  tsconfig.json
  tailwind.config.ts
  postcss.config.js
  supabase/
    schema.sql
  src/
    app/
      layout.tsx               # fonts, theme, AccessibilityBar
      globals.css              # design tokens (CSS variables)
      page.tsx                 # LANDING PAGE (public)
      workspace/page.tsx       # renders the client Workspace
      api/
        save-points/route.ts   # POST create, GET list, PATCH correct/restore
        reconstruct/route.ts   # POST reconstruct one point
    components/
      Workspace.tsx            # client: doc area + save + list + restore
      SavePointButton.tsx
      SavePointList.tsx
      RestoreOffer.tsx         # on-load calm restore offer
      RestoreCard.tsx          # next action first, collapsed detail
      ConfidenceLine.tsx       # renders a field in the voice for its tier
      MoreContext.tsx          # collapsed secondary detail
      AccessibilityBar.tsx     # font / size / reduced-motion (persisted)
      ConnectExtension.tsx     # load-extension help + device id
    lib/
      types.ts                 # shared schema (below)
      client.ts                # device-id + fetch helpers (client)
      supabase.ts              # lazy server client
      gemini.ts                # lazy server client + MODEL
      reconstruct.ts           # Gemini call + strict JSON parse
      reconstruct-prompt.ts    # system prompt + user-message builder
      map.ts                   # DB row <-> SavePoint mapping
  extension/
    manifest.json
    popup.html / popup.css / popup.js
    options.html / options.js  # API base URL + device id
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

export type ReconstructedState = {
  objective: { text: string; confidence: Confidence };
  stoppingPoint: { text: string; confidence: Confidence };
  mainThread: { text: string; confidence: Confidence };
  decisions: Array<{ text: string; confidence: Confidence; needsConfirmation: boolean }>;
  openThreads: Array<{ text: string; relevance: "primary" | "supporting" | "uncertain" }>;
  nextAction: { text: string; confidence: Confidence };
  lowContext: boolean;
  orientingQuestion: string;         // filled only when lowContext
};

export type SavePoint = {
  id: string; deviceId: string; source: CaptureSource;
  userNote: string | null;
  activeContext: SavePointCapture["activeContext"];
  openTabs: NonNullable<SavePointCapture["openTabs"]>;
  workspaceContext: NonNullable<SavePointCapture["workspaceContext"]>;
  reconstruction: ReconstructedState | null;
  restored: boolean; restoredAt: string | null; createdAt: string;
};
```

**Capture scope limit (never exceed):** active tab title/URL, selected text, a short page snippet, optional other-tab titles, the optional note. No full browser history, keystrokes, continuous screen capture, or full page content.

## 5. Database schema (`supabase/schema.sql`)

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

Demo scope: no RLS, no auth; access only through server routes holding the service-role key. Note this in the README.

## 6. API surface

- `POST /api/save-points` — body `{ deviceId, capture: SavePointCapture }` → inserts row → `{ id }`.
- `GET /api/save-points?deviceId=...` → `{ savePoints, latestUnrestored }` (for history + on-load offer).
- `PATCH /api/save-points` — body `{ deviceId, savePointId, correction }` → stores correction / marks restored.
- `POST /api/reconstruct` — body `{ deviceId, savePointId, force? }` → loads row, calls Gemini, caches `ReconstructedState`, marks restored → returns it.

All routes: `export const dynamic = "force-dynamic";` and `export const runtime = "nodejs";`.

## 7. AI pipeline

- `gemini.ts` — lazy `getGemini()` reading `GOOGLE_API_KEY`; `MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"`.
- `reconstruct-prompt.ts` — system prompt (reconstruct cognitive state, not summarize; no fabrication; tier→voice; one physical next action; low-context path; no time/shame language; exact JSON shape) + user-message builder that includes only present signals, truncated (doc ~6000, edits ~1500, selected ~1200, snippet ~1500, ≤15 tabs).
- `reconstruct.ts` — calls Gemini with `generationConfig.responseMimeType = "application/json"`, then **defensive parse**: strip stray fences, `JSON.parse`, validate tiers/arrays/`lowContext`; on failure return a safe low-context fallback (never crash, never fabricate).

## 8. Persistence & identity

Anonymous **device id** (UUID) generated client-side and stored in `localStorage`; sent with every request and set in the extension options so extension saves land in the same "account." No login. Save points are keyed by `device_id`.

## 9. Extension (desktop only)

MV3, no build step. Popup: three states (Ready → optional note → Saved); no dashboard/AI/history in the popup. Captures only allowed fields; posts the shared payload to `POST /api/save-points`. Options page sets API base URL + device id. Never claims mobile support.

## 10. Privacy

Deliberate, minimal capture only at the moment of save — no continuous monitoring, no history scraping. This is both a design principle and the safety story for a tool used by minors. The extension is a save trigger, not a surveillance layer.

## 11. Keyed technical decisions (with rationale)

- **Webpack, not Turbopack** — no working native binary in the target environment.
- **Lazy server clients (Supabase, Gemini)** — importing a route during `next build` must never throw when env vars are absent; fail only if actually called at runtime unconfigured.
- **`force-dynamic` routes** — these are runtime data/AI endpoints; never prerender.
- **Confidence as an enum tier, not a float** — the model is better at a rough tier than a calibrated decimal, and the tier maps cleanly to three speech registers.
- **Free Gemini Flash** — zero cost; the schema/prompt/UI are provider-agnostic, so the model is a single swappable layer.
- **Anonymous device id, no auth** — removes account friction for a 6-day build and keeps scope to the non-goals.
