// Shared contracts. The workspace, the extension, the API, and the AI response
// all speak this one schema so the extension can never drift into a second product.

export type CaptureSource = "workspace" | "extension";

export type SavePointCapture = {
  source: CaptureSource;
  /** Optional, typed OR dictated. Never required — a form at the interruption moment loses the save. */
  userNote?: string;
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
    /** Text added since the previous save — a cheap signal for "what they were just doing". */
    recentEdits?: string;
  };
};

/**
 * Confidence is a TIER, not a float. The model is far better at a rough tier
 * than a calibrated decimal, and the tier maps cleanly to how the tool speaks:
 *   high   -> statement   ("You had chosen Source B.")
 *   medium -> hedge       ("It looks like you were leaning toward Source B.")
 *   low    -> question    ("Were you comparing Source A and Source B?")
 */
export type Confidence = "high" | "medium" | "low";

export type ReconstructedState = {
  objective: { text: string; confidence: Confidence };
  stoppingPoint: { text: string; confidence: Confidence };
  mainThread: { text: string; confidence: Confidence };
  decisions: Array<{
    text: string;
    confidence: Confidence;
    needsConfirmation: boolean;
  }>;
  openThreads: Array<{
    text: string;
    relevance: "primary" | "supporting" | "uncertain";
  }>;
  nextAction: { text: string; confidence: Confidence };
  /** When signal is too thin to reconstruct honestly, the AI sets this and asks one orienting question. */
  lowContext: boolean;
  /** The single orienting question shown in low-context mode. Empty otherwise. */
  orientingQuestion: string;
};

/**
 * Why a reconstruction attempt failed — distinct, specific reasons, never
 * collapsed into one generic "something went wrong." See src/lib/reconstruct.ts
 * for classification and the exact copy shown for each kind.
 */
export type ReconstructFailureKind = "quota" | "auth" | "network" | "parse";

/**
 * The result of one reconstruction attempt. `ok: false` is a genuine failure
 * (the call errored, or its response was unusable) — never a real
 * ReconstructedState, and never persisted as one. This is a different thing
 * from a *successful* call where the model honestly reports thin signal
 * (that's `ok: true` with `state.lowContext === true`).
 */
export type ReconstructOutcome =
  | { ok: true; state: ReconstructedState }
  | { ok: false; kind: ReconstructFailureKind; message: string };

// The full record as stored and returned by the API. Ownership is the signed-in
// user (see src/lib/auth.ts) — there is no anonymous device id anymore.
export type SavePoint = {
  id: string;
  userId: string;
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

// Body for PATCH /api/save-points — records a correction to a flagged decision,
// or simply marks a point restored without a correction. The user is identified
// by the session (cookie or Bearer token), not a field in the body.
export type SavePointPatch = {
  savePointId: string;
  correction?: { decisionIndex: number; wasCorrect: boolean; correctedText?: string };
  markRestored?: boolean;
};

// --- Accounts ---

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  username: string;
};

export type SignupInput = {
  email: string;
  fullName: string;
  username: string;
  password: string;
};

export type LoginInput = {
  username: string;
  password: string;
};
