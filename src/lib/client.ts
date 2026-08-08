"use client";

import type {
  SavePoint,
  SavePointCapture,
  ReconstructedState,
  ReconstructOutcome,
  ReconstructFailureKind,
  AuthUser,
  SignupInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UserMemory,
} from "./types";
import { DEMO_RECONSTRUCTED_STATE } from "./demoFixtures";

// --- Deriving a human label for a save point (rail list, restore offer) ---

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max).trimEnd() + "…";
}

// The order matters: prefer what the AI figured out, then what the student
// said, then what they were looking at, then a preview of what they actually
// wrote — a document with real content but no title/note is common (people
// just start typing), and previously this fell all the way through to a bare
// "Saved session" even when there was plenty to show.
export function savePointLabel(sp: SavePoint): string {
  const objective = sp.reconstruction?.objective.text?.trim();
  if (objective) return objective;

  const note = sp.userNote?.trim();
  if (note) return note;

  const title = sp.workspaceContext?.documentTitle?.trim();
  if (title) return title;

  const activeTitle = sp.activeContext?.title?.trim();
  if (activeTitle) return activeTitle;

  const content = sp.workspaceContext?.documentContent?.trim();
  if (content) return truncate(content, 72);

  return "Saved session";
}

// --- Local safety-net draft (SAFETY-NET PASS) ---
//
// The only place workspace content is written outside an explicit save: a
// plain localStorage draft of the document already in front of the student,
// keyed per-user, so the workspace survives a reload AND a forgotten save
// never means losing what was typed. This never reaches the DB or the AI —
// only an explicit "Save my place" tap (the student's own, or one offered
// by the banner/idle prompt below) turns it into a real save point. It
// observes nothing but this document: no other tabs, no history, no
// background capture.

export type WorkspaceDraft = {
  title: string;
  content: string;
  updatedAt: string;
  /** Set once this exact draft has been turned into a real save point. */
  savedIntoPointId: string | null;
  /** Set when the student dismisses the "you forgot to save" banner for this draft. */
  dismissedAt: string | null;
};

const LAST_SAVED_DOC_KEY = "savepoint.lastSavedDoc";

function draftKey(userId: string): string {
  return `savepoint.draft.${userId}`;
}

export function loadDraft(userId: string): WorkspaceDraft | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(draftKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WorkspaceDraft;
  } catch {
    return null;
  }
}

// Called on every debounced edit, and again on beforeunload — localStorage
// writes are synchronous, so it's safe to call directly from an unload
// handler with no flush delay. A fresh edit always clears any prior
// savedIntoPointId/dismissedAt: new content is, by definition, unsaved again.
export function writeDraft(userId: string, title: string, content: string): void {
  if (typeof window === "undefined") return;
  if (!title.trim() && !content.trim()) {
    localStorage.removeItem(draftKey(userId));
    return;
  }
  const existing = loadDraft(userId);
  const unchanged = existing?.title === title && existing?.content === content;
  const draft: WorkspaceDraft = {
    title,
    content,
    updatedAt: new Date().toISOString(),
    savedIntoPointId: unchanged ? existing.savedIntoPointId : null,
    dismissedAt: unchanged ? existing.dismissedAt : null,
  };
  localStorage.setItem(draftKey(userId), JSON.stringify(draft));
}

// Marks the current draft as captured by a real save point, so the
// "you forgot to save" banner never fires for content that's already saved.
export function markDraftSaved(userId: string, savePointId: string): void {
  if (typeof window === "undefined") return;
  const existing = loadDraft(userId);
  if (!existing) return;
  localStorage.setItem(
    draftKey(userId),
    JSON.stringify({ ...existing, savedIntoPointId: savePointId })
  );
}

// Marks the current draft acknowledged so the same unsaved content doesn't
// nag again. A later edit produces a newer draft via writeDraft above, which
// clears dismissedAt on its own — so resumed work re-arms the banner.
export function dismissDraft(userId: string): void {
  if (typeof window === "undefined") return;
  const existing = loadDraft(userId);
  if (!existing) return;
  localStorage.setItem(
    draftKey(userId),
    JSON.stringify({ ...existing, dismissedAt: new Date().toISOString() })
  );
}

// Text added since the last save point — a cheap "what were you just doing" signal.
export function computeRecentEdits(currentContent: string): string {
  if (typeof window === "undefined") return "";
  const last = localStorage.getItem(LAST_SAVED_DOC_KEY) ?? "";
  if (currentContent.startsWith(last)) {
    return currentContent.slice(last.length).trim();
  }
  // If it isn't a clean append, fall back to the tail of the document.
  return currentContent.slice(-600).trim();
}

export function markDocSaved(content: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SAVED_DOC_KEY, content);
}

// --- Building a workspace capture packet ---

export function buildWorkspaceCapture(
  title: string,
  content: string,
  userNote: string
): SavePointCapture {
  return {
    source: "workspace",
    userNote: userNote.trim() || undefined,
    activeContext: {},
    openTabs: [],
    workspaceContext: {
      documentTitle: title.trim() || undefined,
      documentContent: content.trim() || undefined,
      recentEdits: computeRecentEdits(content) || undefined,
    },
  };
}

// --- Auth API client (session travels as an httpOnly cookie automatically —
// "credentials: include" isn't needed for same-origin fetches, but is safe to
// keep explicit since these calls always run from the workspace's own origin) ---

async function parseJson(res: Response) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

export async function signup(input: SignupInput): Promise<AuthUser> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson(res);
  return data.user as AuthUser;
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson(res);
  return data.user as AuthUser;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<string> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson(res);
  return data.message as string;
}

export async function resetPassword(input: ResetPasswordInput): Promise<AuthUser> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson(res);
  return data.user as AuthUser;
}

// --- Save-point API client (identity comes from the session cookie) ---

export async function createSavePoint(
  capture: SavePointCapture
): Promise<SavePoint> {
  const res = await fetch("/api/save-points", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ capture }),
  });
  const data = await parseJson(res);
  return data.savePoint as SavePoint;
}

export async function listSavePoints(): Promise<{
  savePoints: SavePoint[];
  latestUnrestored: SavePoint | null;
}> {
  const res = await fetch("/api/save-points");
  return parseJson(res);
}

// Demo mode: NEXT_PUBLIC_DEMO_MODE=1 (build-time) or ?demo=1 on /workspace
// (per-visit) both work. This is the ONLY thing demo mode affects — it never
// touches save creation, listing, correction, or the database in any way,
// and it is off unless one of these is explicitly set.
export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "1") return true;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

export async function restoreSavePoint(
  savePointId: string,
  force = false,
  additionalContext?: string,
  rememberContext = false
): Promise<ReconstructOutcome> {
  if (isDemoMode()) {
    return { ok: true, state: DEMO_RECONSTRUCTED_STATE };
  }

  let res: Response;
  try {
    res = await fetch("/api/reconstruct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savePointId, force, additionalContext, rememberContext }),
    });
  } catch {
    return {
      ok: false,
      kind: "network",
      message: "Couldn't reach the app just now. Try again in a moment.",
    };
  }

  let data: {
    ok?: boolean;
    state?: ReconstructedState;
    kind?: ReconstructFailureKind;
    message?: string;
    error?: string;
  };
  try {
    data = await res.json();
  } catch {
    return { ok: false, kind: "parse", message: "Got an unexpected response. Try again." };
  }

  if (data.ok === true && data.state) {
    if (rememberContext) {
      window.dispatchEvent(new Event("savepoint-memory-changed"));
    }
    return { ok: true, state: data.state };
  }
  if (data.ok === false && data.kind) {
    return { ok: false, kind: data.kind, message: data.message ?? "Something went wrong. Try again." };
  }
  // A route error outside the ReconstructOutcome contract (not signed in,
  // missing savePointId, etc.) — surface it rather than crash the UI.
  return { ok: false, kind: "network", message: data.error ?? "Something went wrong. Try again." };
}

// Records a Yes/No confirmation on a flagged decision. Best-effort: the UI
// already updated optimistically, so a network failure here is silent.
export async function correctDecision(
  savePointId: string,
  decisionIndex: number,
  wasCorrect: boolean,
  correctedText?: string
): Promise<SavePoint> {
  const res = await fetch("/api/save-points", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      savePointId,
      correction: { decisionIndex, wasCorrect, correctedText },
    }),
  });
  const data = await parseJson(res);
  window.dispatchEvent(new Event("savepoint-memory-changed"));
  return data.savePoint as SavePoint;
}

export async function markSavePointRestored(savePointId: string): Promise<SavePoint> {
  const res = await fetch("/api/save-points", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ savePointId, markRestored: true }),
  });
  const data = await parseJson(res);
  return data.savePoint as SavePoint;
}

export async function listUserMemory(): Promise<UserMemory[]> {
  const res = await fetch("/api/memory");
  const data = await parseJson(res);
  return data.memories as UserMemory[];
}

export async function createUserMemory(
  text: string,
  originSavePointId?: string
): Promise<UserMemory> {
  const res = await fetch("/api/memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, originSavePointId }),
  });
  const data = await parseJson(res);
  return data.memory as UserMemory;
}

export async function updateUserMemory(id: string, text: string): Promise<UserMemory> {
  const res = await fetch("/api/memory", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, text }),
  });
  const data = await parseJson(res);
  return data.memory as UserMemory;
}

export async function deleteUserMemory(id: string): Promise<void> {
  const res = await fetch(`/api/memory?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  await parseJson(res);
}
