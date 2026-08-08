"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SavePoint, SavePointCapture, ReconstructOutcome, AuthUser } from "@/lib/types";
import {
  buildWorkspaceCapture,
  createSavePoint,
  listSavePoints,
  restoreSavePoint,
  loadDraft,
  writeDraft,
  markDraftSaved,
  dismissDraft,
  markDocSaved,
  markSavePointRestored,
  logout,
  type WorkspaceDraft,
} from "@/lib/client";
import { SavePointButton } from "./SavePointButton";
import { RestoreOffer } from "./RestoreOffer";
import { RestoreCard } from "./RestoreCard";
import { RestorePreview } from "./RestorePreview";
import { SavePlacePrompt } from "./SavePlacePrompt";
import { SavePointList } from "./SavePointList";
import { AccessibilityBar } from "./AccessibilityBar";
import { PendingCaptureCard } from "./PendingCaptureCard";
import { MarkerDot } from "./MarkerDot";
import { MemoryPanel } from "./MemoryPanel";
import { DEMO_RECONSTRUCTED_STATE, EXAMPLE_SAVE_POINT } from "@/lib/demoFixtures";

// SAFETY-NET PASS: how long the student can go without editing the workspace
// document before a gentle "want me to save your place?" offer appears.
// Local, workspace-only activity — see the effect below for the exact
// two signals this reads (edit happened / timer elapsed), nothing else.
const IDLE_OFFER_MS = 120_000;

function draftLabel(draft: WorkspaceDraft): string {
  const title = draft.title.trim();
  if (title) return title;
  const content = draft.content.trim();
  if (!content) return "your last session";
  return content.length > 60 ? content.slice(0, 60).trimEnd() + "…" : content;
}

// What the mobile bookmarklet (see /docs) packs into ?capture= — the same
// scope as the extension's activeContext, nothing more.
type BookmarkletCapture = {
  title?: string;
  url?: string;
  selectedText?: string;
  visibleTextSnippet?: string;
};

type View =
  | { mode: "writing" }
  | { mode: "restoring"; savePoint: SavePoint }
  | { mode: "restored"; savePoint: SavePoint; outcome: ReconstructOutcome };

function safeWebUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function Workspace({ user }: { user: AuthUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [savePoints, setSavePoints] = useState<SavePoint[]>([]);
  const [offer, setOffer] = useState<SavePoint | null>(null);
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [view, setView] = useState<View>({ mode: "writing" });
  const [loggingOut, setLoggingOut] = useState(false);
  const [pendingCapture, setPendingCapture] = useState<BookmarkletCapture | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [forgottenDraft, setForgottenDraft] = useState<WorkspaceDraft | null>(null);
  const [idleOffer, setIdleOffer] = useState(false);
  const [safetySaving, setSafetySaving] = useState(false);
  const hydratedRef = useRef(false);
  // What's actually been saved so far — starts empty, and is only ever
  // updated the moment a real save point is created (see handleSave). This
  // is what "unsaved changes" is measured against, so the idle offer can
  // never fire for content that's already been saved.
  const lastSavedRef = useRef<{ title: string; content: string }>({ title: "", content: "" });

  // A genuinely blank workspace — nothing typed yet. This is the moment the
  // preview and the example button exist for; the instant there's real
  // content, the promise has done its job and gets out of the way.
  const isEmpty = !title.trim() && !content.trim();

  const hasUnsavedChanges =
    (title.trim() !== "" || content.trim() !== "") &&
    (title !== lastSavedRef.current.title || content !== lastSavedRef.current.content);

  // Load draft + past save points on mount. The unrestored one becomes the offer.
  useEffect(() => {
    const draft = loadDraft(user.id);
    if (draft) {
      setTitle(draft.title);
      setContent(draft.content);
      if (draft.savedIntoPointId) {
        // This exact content is already captured in a real save point —
        // nothing unsaved here, so seed the baseline to match.
        lastSavedRef.current = { title: draft.title, content: draft.content };
      } else if (!draft.dismissedAt) {
        setForgottenDraft(draft);
      }
    }
    hydratedRef.current = true;
    listSavePoints()
      .then(({ savePoints, latestUnrestored }) => {
        setSavePoints(savePoints);
        if (latestUnrestored) setOffer(latestUnrestored);
      })
      .catch(() => {
        /* offline / not configured — workspace still usable */
      });
  }, [user.id]);

  // Persist the draft as they type so the workspace itself survives a reload.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const t = setTimeout(() => writeDraft(user.id, title, content), 400);
    return () => clearTimeout(t);
  }, [user.id, title, content]);

  useEffect(() => {
    const persistNow = () => writeDraft(user.id, title, content);
    window.addEventListener("beforeunload", persistNow);
    return () => window.removeEventListener("beforeunload", persistNow);
  }, [user.id, title, content]);

  // Idle-activity timer — the only two signals this reads are "the workspace
  // input changed" (this effect's dependencies) and "a timer elapsed with no
  // change" (the setTimeout below). No other tab, no history, no background
  // capture. It only ever arms while there's something unsaved to lose.
  useEffect(() => {
    setIdleOffer(false);
    if (!hasUnsavedChanges) return;
    const timer = window.setTimeout(() => setIdleOffer(true), IDLE_OFFER_MS);
    return () => window.clearTimeout(timer);
  }, [title, content, hasUnsavedChanges]);

  // The mobile bookmarklet fallback (see /docs) lands here with ?capture=,
  // since it has no way to authenticate directly the way the extension does
  // (a bookmarklet runs on a third-party page and can't read this site's
  // httpOnly session cookie). It hands off the captured context instead, and
  // this workspace — already signed in — turns it into a real save point.
  useEffect(() => {
    const raw = searchParams.get("capture");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as BookmarkletCapture;
      setPendingCapture(parsed);
    } catch {
      /* malformed or tampered-with param — best-effort, fail silently */
    }
    router.replace("/workspace");
  }, [searchParams, router]);

  const handleSaveCapture = useCallback(
    async (note: string) => {
      if (!pendingCapture) return;
      const capture: SavePointCapture = {
        source: "extension",
        userNote: note.trim() || undefined,
        activeContext: {
          title: pendingCapture.title,
          url: pendingCapture.url,
          selectedText: pendingCapture.selectedText,
          visibleTextSnippet: pendingCapture.visibleTextSnippet,
        },
        openTabs: [],
        workspaceContext: {},
      };
      const sp = await createSavePoint(capture);
      setSavePoints((prev) => [sp, ...prev]);
      setPendingCapture(null);
    },
    [pendingCapture]
  );

  const handleSave = useCallback(
    async (note: string) => {
      const capture = buildWorkspaceCapture(title, content, note);
      const sp = await createSavePoint(capture);
      markDocSaved(content);
      markDraftSaved(user.id, sp.id);
      lastSavedRef.current = { title, content };
      setSavePoints((prev) => [sp, ...prev]);
      setOffer(null);
      setForgottenDraft(null);
      setIdleOffer(false);
    },
    [title, content, user.id]
  );

  const saveFromSafetyNet = useCallback(async () => {
    setSafetySaving(true);
    try {
      await handleSave("");
    } finally {
      setSafetySaving(false);
    }
  }, [handleSave]);

  // Only the on-load "you forgot to save" banner persists its dismissal —
  // that's the one tied to a specific draft that should stay quiet on the
  // next reload. The idle offer's "Not now" is scoped to the current idle
  // stretch only (see the idle-timer effect above), never written to
  // localStorage, so it never accidentally silences a genuine unsaved-draft
  // warning on a later visit.
  const dismissSafetyNet = useCallback(() => {
    if (forgottenDraft) dismissDraft(user.id);
    setForgottenDraft(null);
    setIdleOffer(false);
  }, [user.id, forgottenDraft]);

  const openRestore = useCallback(async (sp: SavePoint, force = false) => {
    setView({ mode: "restoring", savePoint: sp });
    setOffer(null);
    setShowExample(false);
    // restoreSavePoint never throws — it always resolves to a ReconstructOutcome,
    // so a real failure renders its own honest card instead of silently
    // bouncing back to the writing view.
    const outcome = await restoreSavePoint(sp.id, force);
    setView({ mode: "restored", savePoint: sp, outcome });
    if (outcome.ok) {
      setSavePoints((prev) =>
        prev.map((p) => (p.id === sp.id ? { ...p, restored: true } : p))
      );
    }
  }, []);

  // A failed reconstruction is never cached, so retrying just re-runs the
  // same restore — no special "force" flag needed for that case, but
  // passing force=true also lets someone deliberately ask for a fresh take
  // on an already-restored point (e.g. after adding more context).
  const retryRestore = useCallback(
    (sp: SavePoint) => openRestore(sp, true),
    [openRestore]
  );

  const addOrientingContext = useCallback(async (
    sp: SavePoint,
    answer: string,
    remember: boolean
  ) => {
    setView({ mode: "restoring", savePoint: sp });
    const outcome = await restoreSavePoint(sp.id, true, answer, remember);
    setView({ mode: "restored", savePoint: sp, outcome });
  }, []);

  const takeMeBack = useCallback((sp: SavePoint, outcome: ReconstructOutcome) => {
    if (!outcome.ok) return;
    const activeUrl = safeWebUrl(sp.activeContext.url);
    if (activeUrl) {
      window.open(activeUrl, "_blank", "noopener,noreferrer");
    }
    navigator.clipboard?.writeText(outcome.state.nextAction.text).catch(() => {});
    markSavePointRestored(sp.id).catch(() => {
      /* Reconstruction already marks it restored; returning must never get stuck. */
    });

    if (sp.source === "workspace") {
      const restoredTitle = sp.workspaceContext.documentTitle ?? "";
      const restoredContent = sp.workspaceContext.documentContent ?? "";
      setTitle(restoredTitle);
      setContent(restoredContent);
      // This content already exists as a real save point — it isn't
      // "unsaved" the moment it lands back in the editor, so the idle
      // offer shouldn't arm for it until they actually change something.
      lastSavedRef.current = { title: restoredTitle, content: restoredContent };
      setView({ mode: "writing" });
    }
  }, []);

  const updateSavePoint = useCallback((updated: SavePoint) => {
    setSavePoints((previous) =>
      previous.map((point) => (point.id === updated.id ? updated : point))
    );
    setView((current) =>
      current.mode === "restored" && current.savePoint.id === updated.id
        ? {
            ...current,
            savePoint: updated,
            outcome: updated.reconstruction
              ? { ok: true, state: updated.reconstruction }
              : current.outcome,
          }
        : current
    );
  }, []);

  const backToWriting = useCallback(() => {
    setView({ mode: "writing" });
    setShowExample(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await logout();
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <div className="wrap py-8 sm:py-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-2 font-mono text-base font-bold text-ink">
          <MarkerDot />
          Save&nbsp;Point
        </a>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-soft">
            Signed in as <span className="font-bold text-ink">{user.username}</span>
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft transition-colors hover:text-ink disabled:opacity-60"
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[280px_1fr]">
        {/* LEFT RAIL */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-8">
          <button
            onClick={backToWriting}
            className="w-full rounded-lg border border-line bg-mist px-4 py-3 text-left font-bold text-ink transition-colors hover:border-sage"
          >
            ＋ New save point
          </button>

          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">
              Your save points
            </h2>
            <SavePointList
              savePoints={savePoints}
              onOpen={openRestore}
              onSeeExample={() => setShowExample(true)}
            />
          </div>

          <AccessibilityBar variant="inline" />
          <MemoryPanel />

          {/* Desktop only — extensions don't run on mobile, so this would
              just be confusing clutter there. See the mobile box below. */}
          <div className="hidden rounded-card border border-line bg-mist p-4 text-sm text-ink-soft lg:block">
            <p className="font-bold text-ink-soft">Using the desktop extension?</p>
            <p className="mt-1.5">
              Install it, open it, and sign in with the same username — it links
              automatically. No codes to copy.
            </p>
            <a
              href="/docs#extension"
              className="mt-2 inline-block text-sage underline underline-offset-2"
            >
              Load the extension
            </a>
          </div>

          {/* Mobile/tablet only — the extension's actual replacement here. */}
          <div className="rounded-card border border-line bg-mist p-4 text-sm text-ink-soft lg:hidden">
            <p className="font-bold text-ink-soft">On your phone?</p>
            <p className="mt-1.5">
              Chrome extensions don&apos;t run on mobile — that&apos;s an
              Apple/Google restriction, not something this build chose. A
              one-tap bookmarklet captures pages the same way instead.
            </p>
            <a
              href="/docs#mobile"
              className="mt-2 inline-block text-sage underline underline-offset-2"
            >
              Get the bookmarklet
            </a>
          </div>
        </aside>

        {/* MAIN PANE */}
        <main className="min-w-0">
          {(forgottenDraft || idleOffer) && view.mode === "writing" && (
            <div className="mb-6">
              <SavePlacePrompt
                message={
                  forgottenDraft ? (
                    <>
                      You were working on <strong>&ldquo;{draftLabel(forgottenDraft)}&rdquo;</strong> and
                      didn&apos;t save your place. Want me to hold it?
                    </>
                  ) : (
                    <>Looks like you stepped away — want me to save your place?</>
                  )
                }
                dismissLabel={forgottenDraft ? "Dismiss" : "Not now"}
                saving={safetySaving}
                onSave={saveFromSafetyNet}
                onDismiss={dismissSafetyNet}
              />
            </div>
          )}
          {/* Landing spot for the mobile bookmarklet fallback */}
          {pendingCapture && view.mode === "writing" && (
            <div className="mb-6">
              <PendingCaptureCard
                capture={pendingCapture}
                onSave={handleSaveCapture}
                onDiscard={() => setPendingCapture(null)}
              />
            </div>
          )}

          {/* On-load restore offer — a quiet banner, not a takeover */}
          {offer && !offerDismissed && view.mode === "writing" && (
            <div className="mb-6">
              <RestoreOffer
                savePoint={offer}
                onRestore={() => openRestore(offer)}
                onDismiss={() => setOfferDismissed(true)}
              />
            </div>
          )}

          {view.mode === "restoring" && (
            <div
              role="status"
              className="rounded-card bg-mist p-10 text-center text-ink-soft shadow-card"
            >
              Picking up your thread…
            </div>
          )}

          {view.mode === "restored" && (
            <div className="space-y-4">
              <RestoreCard
                savePoint={view.savePoint}
                outcome={view.outcome}
                onRetry={() => retryRestore(view.savePoint)}
                onAddContext={(answer, remember) =>
                  addOrientingContext(view.savePoint, answer, remember)
                }
                onTakeBack={() => takeMeBack(view.savePoint, view.outcome)}
                onSavePointUpdated={updateSavePoint}
              />
              <button
                onClick={backToWriting}
                className="text-ink-soft transition-colors hover:text-ink"
              >
                ← Back to writing
              </button>
            </div>
          )}

          {view.mode === "writing" && showExample && (
            <div className="space-y-4">
              <div className="rounded-md border border-marker/40 bg-marker/10 px-4 py-3 text-center text-sm font-bold text-marker">
                EXAMPLE — not your saved data
              </div>
              <RestoreCard
                savePoint={EXAMPLE_SAVE_POINT}
                outcome={{ ok: true, state: DEMO_RECONSTRUCTED_STATE }}
                readOnly
              />
              <button
                onClick={() => setShowExample(false)}
                className="text-ink-soft transition-colors hover:text-ink"
              >
                ← Close example
              </button>
            </div>
          )}

          {view.mode === "writing" && !showExample && (
            <>
              <section className="rounded-card bg-mist p-6 shadow-card sm:p-8">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What are you working on? (e.g. Biology report)"
                  aria-label="Document title"
                  className="w-full bg-transparent text-lg font-bold text-ink placeholder:text-ink-soft/60 focus:outline-none"
                />
                <div className="my-4 h-px bg-line" />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write, research, think here. When you need to step away, save your place below — I'll hold the thread so you don't have to."
                  aria-label="Your work"
                  rows={16}
                  className="w-full resize-none bg-transparent text-ink placeholder:text-ink-soft/50 focus:outline-none"
                />
                <div className="mt-6">
                  <SavePointButton onSave={handleSave} />
                </div>
              </section>

              {isEmpty && <RestorePreview onSeeExample={() => setShowExample(true)} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
